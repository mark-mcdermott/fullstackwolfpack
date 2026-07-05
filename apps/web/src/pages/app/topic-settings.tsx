import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeading, Panel, ProgressMeter, SectionLabel } from '@fw/ui'
import { DIFFICULTIES } from '@/core/adaptive'
import type { TopicProgress } from '@/core/app-data'
import { DEFAULT_GENERATION_ETA_MS, type Difficulty } from '@/core/generation'
import type { TopicTracks } from '@/core/schemas'
import { useAsync } from '@/hooks/use-async'
import { topicCoursePath } from '@/lib/open-course'
import { cn } from '@/lib/utils'

// Switch the topic's active difficulty track. A level with an existing course
// switches instantly (its own progress preserved); a new level is generated (~20s).
function DifficultyPanel({
  topicSlug,
  onChange,
}: {
  topicSlug: string
  onChange: () => void
}) {
  const [tracks, setTracks] = useState<TopicTracks | null>(null)
  const [busy, setBusy] = useState<Difficulty | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [etaMs, setEtaMs] = useState(DEFAULT_GENERATION_ETA_MS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api.courses
      .tracks(topicSlug)
      .then((t) => active && setTracks(t))
      .catch(() => {})
    api.courses
      .generationEta()
      .then((r) => active && setEtaMs(r.etaMs))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [topicSlug])

  // Ease the bar toward 95% over the expected generation time; snaps away on done.
  useEffect(() => {
    if (!generating) return
    const startedAt = performance.now()
    const id = setInterval(() => {
      const elapsed = performance.now() - startedAt
      setProgress(Math.min(95, (elapsed / Math.max(etaMs, 1)) * 100))
    }, 120)
    return () => clearInterval(id)
  }, [generating, etaMs])

  async function choose(difficulty: Difficulty) {
    if (busy || tracks?.activeDifficulty === difficulty) return
    const willGenerate = !tracks?.tracks.find((t) => t.difficulty === difficulty)
      ?.exists
    setBusy(difficulty)
    setGenerating(willGenerate)
    setProgress(0)
    setError(null)
    try {
      await api.courses.setDifficulty(topicSlug, difficulty)
      setTracks(await api.courses.tracks(topicSlug))
      onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change difficulty')
    } finally {
      setBusy(null)
      setGenerating(false)
      setProgress(0)
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
        <div
          className="relative mt-3 h-9 overflow-hidden border border-primary/50"
          role="progressbar"
          aria-label={`Generating ${busy} course`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-widest text-primary uppercase">
            Generating {busy}… {Math.round(progress)}%
          </span>
        </div>
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
  const state = useAsync(() => api.data.topics())

  return (
    <div>
      <AsyncView state={state}>
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
                <DifficultyPanel topicSlug={topic.slug} onChange={state.reload} />
                <ResetPanel topic={topic} onReset={state.reload} />
              </div>
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
