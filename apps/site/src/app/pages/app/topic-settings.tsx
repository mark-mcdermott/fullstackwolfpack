import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeading, Panel, ProgressMeter, SectionLabel } from '@fw/ui'
import { DIFFICULTIES } from '@/core/adaptive'
import type { TopicProgress } from '@/core/app-data'
import { DEFAULT_GENERATION_ETA_MS, type Difficulty } from '@/core/generation'
import type { TailorMode, TopicTracks } from '@/core/schemas'
import { useAsync } from '@/hooks/use-async'
import { topicCoursePath } from '@/lib/open-course'
import { cn } from '@/lib/utils'

// Ease a progress value toward 95% over the expected generation time. Snaps back
// to 0 when inactive; the caller reloads and re-renders on completion.
function useEaseProgress(active: boolean, etaMs: number) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!active) {
      setProgress(0)
      return
    }
    const startedAt = performance.now()
    const id = setInterval(() => {
      const elapsed = performance.now() - startedAt
      setProgress(Math.min(95, (elapsed / Math.max(etaMs, 1)) * 100))
    }, 120)
    return () => clearInterval(id)
  }, [active, etaMs])
  return progress
}

function GenBar({ progress, label }: { progress: number; label: string }) {
  return (
    <div
      className="relative mt-3 h-9 overflow-hidden border border-primary/50"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-150 ease-linear"
        style={{ width: `${progress}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-widest text-primary uppercase">
        {label}… {Math.round(progress)}%
      </span>
    </div>
  )
}

// Switch the topic's active difficulty track. An existing level switches instantly
// (its own progress intact); a new level is generated (~20s).
function DifficultyPanel({
  slug,
  tracks,
  etaMs,
  onChanged,
}: {
  slug: string
  tracks: TopicTracks | null
  etaMs: number
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<Difficulty | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const progress = useEaseProgress(generating, etaMs)

  async function choose(difficulty: Difficulty) {
    if (busy || tracks?.activeDifficulty === difficulty) return
    const willGenerate = !tracks?.tracks.find((t) => t.difficulty === difficulty)
      ?.exists
    setBusy(difficulty)
    setGenerating(willGenerate)
    setError(null)
    try {
      await api.courses.setDifficulty(slug, difficulty)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change difficulty')
    } finally {
      setBusy(null)
      setGenerating(false)
    }
  }

  return (
    <Panel>
      <SectionLabel>Difficulty</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Switch this topic's level. Each level keeps its own progress; a “+” level
        has no course yet and is generated on the spot (~20s).
      </p>
      <div className="mt-4 flex divide-x divide-border border border-border">
        {DIFFICULTIES.map((lvl) => {
          const track = tracks?.tracks.find((t) => t.difficulty === lvl)
          const isActive = tracks?.activeDifficulty === lvl
          const needsGen = !!track && !track.exists && !isActive
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => choose(lvl)}
              disabled={busy !== null || !tracks}
              aria-pressed={isActive}
              className={cn(
                'flex-1 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {lvl}
              {needsGen && <span className="ml-1 opacity-60">+</span>}
            </button>
          )
        })}
      </div>
      {busy && generating ? (
        <GenBar progress={progress} label={`Generating ${busy}`} />
      ) : busy ? (
        <p className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Switching to {busy}…
        </p>
      ) : (
        tracks && (
          <p className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Active level:{' '}
            <span className="text-foreground">
              {tracks.activeDifficulty ?? '—'}
            </span>
          </p>
        )
      )}
      {error && (
        <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
      )}
    </Panel>
  )
}

const TAILOR_MODES: { key: TailorMode; label: string; hint: string }[] = [
  {
    key: 'append',
    label: 'Add lessons',
    hint: 'Extend the current course — keeps your progress.',
  },
  {
    key: 'rebuild',
    label: 'Rebuild',
    hint: 'Regenerate the whole course — resets this track.',
  },
]

// Tailor the active course from a free-text instruction: append lessons (owned
// courses only) or rebuild it. Both regenerate content (~20s).
function TailorPanel({
  slug,
  tracks,
  etaMs,
  onChanged,
}: {
  slug: string
  tracks: TopicTracks | null
  etaMs: number
  onChanged: () => void
}) {
  const canAppend = tracks?.activeOwned ?? false
  const [mode, setMode] = useState<TailorMode>('append')
  const [instructions, setInstructions] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const progress = useEaseProgress(busy, etaMs)

  // Append needs a course the user generated; fall back to rebuild otherwise.
  useEffect(() => {
    if (!canAppend && mode === 'append') setMode('rebuild')
  }, [canAppend, mode])

  async function submit() {
    const text = instructions.trim()
    if (busy || text === '') return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const r = await api.courses.tailor(slug, mode, text)
      setNotice(
        r.mode === 'append'
          ? `Added ${r.lessonsAdded} lesson${r.lessonsAdded === 1 ? '' : 's'}.`
          : `Rebuilt with ${r.lessonsAdded} lessons.`,
      )
      setInstructions('')
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not tailor the course')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <SectionLabel>Tailor lessons</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Tell the generator what to add or emphasize, then add it to the current
        course or rebuild the whole thing.
      </p>
      <div className="mt-4 flex divide-x divide-border border border-border">
        {TAILOR_MODES.map((m) => {
          const disabled = m.key === 'append' && !canAppend
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              disabled={busy || disabled}
              aria-pressed={mode === m.key}
              className={cn(
                'flex-1 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                mode === m.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {m.label}
            </button>
          )
        })}
      </div>
      <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-wide text-muted-foreground">
        {TAILOR_MODES.find((m) => m.key === mode)?.hint}
        {!canAppend && ' Adding needs a course you generated — rebuild first.'}
      </p>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        disabled={busy}
        rows={3}
        placeholder="e.g. Add lessons covering IIFEs and promises"
        className="mt-3 w-full resize-y border border-border bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-muted-foreground disabled:opacity-60"
      />
      {busy ? (
        <GenBar
          progress={progress}
          label={mode === 'append' ? 'Adding lessons' : 'Rebuilding'}
        />
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={instructions.trim() === ''}
          className="mt-3 bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === 'append' ? 'Add lessons →' : 'Rebuild course →'}
        </button>
      )}
      {notice && (
        <p className="mt-2 font-mono text-[10px] tracking-widest text-primary uppercase">
          ✓ {notice}
        </p>
      )}
      {error && (
        <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
      )}
    </Panel>
  )
}

// Destructive: wipe this topic's progress (keeps XP/streak). Confirmed via dialog.
function ResetPanel({
  topic,
  onReset,
}: {
  topic: TopicProgress
  onReset: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function reset() {
    setBusy(true)
    setError(null)
    try {
      await api.courses.resetTopic(topic.slug)
      setConfirming(false)
      setDone(true)
      onReset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset progress')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <SectionLabel>Reset progress</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Clear your lesson progress, quiz answers, and review cards for{' '}
        {topic.name} and start the course over. Your XP and streak are kept.
      </p>
      {done ? (
        <p className="mt-4 font-mono text-[10px] tracking-widest text-primary uppercase">
          ✓ Progress reset
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 border border-destructive px-4 py-2 font-mono text-xs tracking-widest text-destructive uppercase transition-colors hover:bg-destructive/10"
        >
          Reset progress
        </button>
      )}
      {error && (
        <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Reset ${topic.name}?`}
        description={`This permanently clears your progress, quiz answers, and review cards for ${topic.name}. Your XP and streak stay. This can't be undone.`}
        confirmLabel="Reset progress"
        destructive
        busy={busy}
        onConfirm={reset}
      />
    </Panel>
  )
}

export function TopicSettingsPage() {
  const { slug = '' } = useParams()
  const topicsState = useAsync(() => api.data.topics())
  const [tracks, setTracks] = useState<TopicTracks | null>(null)
  const [etaMs, setEtaMs] = useState(DEFAULT_GENERATION_ETA_MS)

  const reloadTracks = useCallback(() => {
    api.courses
      .tracks(slug)
      .then(setTracks)
      .catch(() => {})
  }, [slug])

  const { reload: reloadTopics } = topicsState
  const onChanged = useCallback(() => {
    reloadTracks()
    reloadTopics()
  }, [reloadTracks, reloadTopics])

  useEffect(() => {
    reloadTracks()
    api.courses
      .generationEta()
      .then((r) => setEtaMs(r.etaMs))
      .catch(() => {})
  }, [reloadTracks])

  return (
    <div>
      <AsyncView state={topicsState}>
        {(topics) => {
          const topic = topics.find((t) => t.slug === slug)
          if (!topic) {
            return <EmptyState message="That topic could not be found." />
          }
          return (
            <div>
              <Link
                to={topicCoursePath(topic.slug)}
                className="mb-4 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3" /> Back to topic
              </Link>
              <PageHeading
                label="Topic settings"
                title={topic.name}
                subtitle="Manage this topic's course and your progress."
              />
              <div className="grid gap-5">
                <Panel>
                  <SectionLabel>Progress</SectionLabel>
                  <div className="mt-4 flex items-center justify-between font-mono text-xs">
                    <span className="tracking-widest text-muted-foreground uppercase">
                      {topic.difficulty}
                    </span>
                    <span>
                      {topic.lessonsCompleted} / {topic.lessonsTotal} lessons ·{' '}
                      {topic.pct}%
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressMeter value={topic.pct} />
                  </div>
                </Panel>
                <DifficultyPanel
                  slug={topic.slug}
                  tracks={tracks}
                  etaMs={etaMs}
                  onChanged={onChanged}
                />
                <TailorPanel
                  slug={topic.slug}
                  tracks={tracks}
                  etaMs={etaMs}
                  onChanged={onChanged}
                />
                <ResetPanel topic={topic} onReset={onChanged} />
              </div>
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
