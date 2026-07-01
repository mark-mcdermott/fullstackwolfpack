import { Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { PageHeading, Panel, ProgressMeter } from '@/components/ui-kit'
import type { TopicProgress } from '@/core/app-data'
import type { Difficulty } from '@/core/generation'
import { useAsync } from '@/hooks/use-async'
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

const DIFFICULTIES: readonly string[] = ['beginner', 'intermediate', 'advanced']

function TopicCard({ topic }: { topic: TopicProgress }) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setStatus('generating')
    setError(null)
    const difficulty: Difficulty = DIFFICULTIES.includes(topic.difficulty)
      ? (topic.difficulty as Difficulty)
      : 'beginner'
    try {
      await api.courses.enroll(topic.slug, difficulty)
      setStatus('done')
    } catch (e) {
      setStatus('idle')
      setError(e instanceof Error ? e.message : 'Generation failed')
    }
  }

  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center border border-border font-mono text-xs font-bold">
          {topic.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="font-mono text-xs">{topic.pct}%</span>
      </div>
      <h3 className="text-lg font-bold uppercase">{topic.name}</h3>
      <ProgressMeter value={topic.pct} />
      <div className="flex justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        <span>{topic.difficulty}</span>
        <span>
          {topic.lessonsCompleted} / {topic.lessonsTotal} lessons
        </span>
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={status !== 'idle'}
        className="mt-1 border border-border py-2 font-mono text-[10px] tracking-widest uppercase hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'generating'
          ? 'Generating…'
          : status === 'done'
            ? 'Course ready ✓'
            : 'Generate course →'}
      </button>
      {error && (
        <p className="font-mono text-[10px] text-destructive">{error}</p>
      )}
    </Panel>
  )
}

export function TopicsPage() {
  const [tab, setTab] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const state = useAsync(() => api.data.topics())

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
                <TopicCard key={t.slug} topic={t} />
              ))}
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
