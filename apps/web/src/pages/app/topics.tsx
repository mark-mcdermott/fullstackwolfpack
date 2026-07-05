import { Search, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { PageHeading, Panel, ProgressMeter } from '@fw/ui'
import { DIFFICULTIES } from '@/core/adaptive'
import type { TopicProgress } from '@/core/app-data'
import { DEFAULT_GENERATION_ETA_MS, type Difficulty } from '@/core/generation'
import { useAsync } from '@/hooks/use-async'
import { nextLessonPath } from '@/lib/open-course'
import { cn } from '@/lib/utils'

const TABS: [string, string | null][] = [
  ['All Topics', null],
  ['Frontend', 'frontend'],
  ['Backend', 'backend'],
  ['DevOps', 'devops'],
  ['Databases', 'databases'],
  ['Tools', 'tools'],
  ['AI & Data', 'ai_data'],
]

function isLevel(v: string): v is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(v)
}

function TopicCard({
  topic,
  highlighted = false,
  etaMs = DEFAULT_GENERATION_ETA_MS,
}: {
  topic: TopicProgress
  highlighted?: boolean
  etaMs?: number
}) {
  const navigate = useNavigate()
  const hasCourse = topic.lessonsTotal > 0
  const [busy, setBusy] = useState<null | 'generating' | 'opening'>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [level, setLevel] = useState<Difficulty>(
    isLevel(topic.difficulty) ? topic.difficulty : 'beginner',
  )

  // When deep-linked (`/app/topics?topic=slug`), bring the card into view.
  useEffect(() => {
    if (!highlighted) return
    const el = document.getElementById(`topic-${topic.slug}`)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted, topic.slug])

  // Drive the ETA progress bar while generating: ease toward 95% over the
  // expected duration, then generate() snaps to 100% on success and navigates.
  // Cleared automatically when generation ends or the card unmounts.
  useEffect(() => {
    if (busy !== 'generating') return
    const startedAt = performance.now()
    const id = setInterval(() => {
      const elapsed = performance.now() - startedAt
      setProgress(Math.min(95, (elapsed / Math.max(etaMs, 1)) * 100))
    }, 120)
    return () => clearInterval(id)
  }, [busy, etaMs])

  async function start() {
    setBusy('opening')
    setError(null)
    try {
      navigate(await nextLessonPath(topic.slug))
    } catch (e) {
      setBusy(null)
      setError(e instanceof Error ? e.message : 'Could not open the course')
    }
  }

  async function generate() {
    setBusy('generating')
    setError(null)
    setProgress(0)
    try {
      await api.courses.enroll(topic.slug, level)
      setProgress(100)
      navigate(await nextLessonPath(topic.slug)) // straight into the fresh course
    } catch (e) {
      setBusy(null)
      setProgress(0)
      setError(e instanceof Error ? e.message : 'Generation failed')
    }
  }

  return (
    <Panel
      id={`topic-${topic.slug}`}
      className={cn(
        'flex scroll-mt-24 flex-col gap-3 transition-shadow',
        highlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center border border-border font-mono text-xs font-bold">
          {topic.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{topic.pct}%</span>
          <Link
            to={`/app/topics/${topic.slug}/settings`}
            aria-label={`${topic.name} settings`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
      <h3 className="text-lg font-bold uppercase">{topic.name}</h3>
      <ProgressMeter value={topic.pct} />
      {hasCourse ? (
        <div className="flex justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          <span>{topic.difficulty}</span>
          <span>
            {topic.lessonsCompleted} / {topic.lessonsTotal} lessons
          </span>
        </div>
      ) : (
        busy !== 'generating' && (
          <div>
            <span className="mb-1.5 block font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Level
            </span>
            <div className="flex divide-x divide-border border border-border">
              {DIFFICULTIES.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  aria-pressed={level === lvl}
                  className={cn(
                    'flex-1 py-1.5 font-mono text-[9px] tracking-wide uppercase transition-colors',
                    level === lvl
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )
      )}
      {hasCourse ? (
        <button
          type="button"
          onClick={start}
          disabled={busy !== null}
          className="mt-1 bg-primary py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'opening'
            ? 'Opening…'
            : topic.lessonsCompleted > 0
              ? 'Continue learning →'
              : 'Start learning →'}
        </button>
      ) : busy === 'generating' ? (
        <div
          className="relative mt-1 h-9 overflow-hidden border border-primary/50"
          role="progressbar"
          aria-label="Generating course"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-widest text-primary uppercase">
            Generating… {Math.round(progress)}%
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          className="mt-1 bg-primary py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
        >
          Start learning →
        </button>
      )}
      {error && (
        <p className="font-mono text-[10px] text-destructive">{error}</p>
      )}
    </Panel>
  )
}

export function TopicsPage() {
  const [tab, setTab] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [params] = useSearchParams()
  const focusSlug = params.get('topic')
  const [etaMs, setEtaMs] = useState(DEFAULT_GENERATION_ETA_MS)
  const state = useAsync(() => api.data.topics())

  // Prefetch the expected generation duration so the progress bar's ETA is
  // ready before any card is generated. Falls back to the default on failure.
  useEffect(() => {
    let active = true
    api.courses
      .generationEta()
      .then((r) => active && setEtaMs(r.etaMs))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeading
        label="Topics"
        title="Topics"
        subtitle="Explore topics, track your progress, and master new skills."
      />
      <div className="mb-4 flex items-center gap-2 border border-border px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics..."
          className="w-full bg-transparent py-2 font-mono text-xs outline-none"
        />
      </div>
      <div className="mb-6 flex flex-wrap gap-4 border-b border-border">
        {TABS.map(([label, cat]) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(cat)}
            className={cn(
              'pb-2 font-mono text-xs tracking-widest uppercase',
              tab === cat
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <AsyncView state={state}>
        {(all) => {
          const topics = all.filter(
            (t) =>
              (!tab || t.category === tab) &&
              t.name.toLowerCase().includes(q.toLowerCase()),
          )
          if (topics.length === 0) {
            return <EmptyState message="No topics match your search." />
          }
          return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => (
                <TopicCard
                  key={t.slug}
                  topic={t}
                  highlighted={t.slug === focusSlug}
                  etaMs={etaMs}
                />
              ))}
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
