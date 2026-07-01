import { Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { PageHeading, Panel, ProgressMeter } from '@/components/ui-kit'
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
                <Panel key={t.slug} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center border border-border font-mono text-xs font-bold">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-mono text-xs">{t.pct}%</span>
                  </div>
                  <h3 className="text-lg font-bold uppercase">{t.name}</h3>
                  <ProgressMeter value={t.pct} />
                  <div className="flex justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    <span>{t.difficulty}</span>
                    <span>
                      {t.lessonsCompleted} / {t.lessonsTotal} lessons
                    </span>
                  </div>
                </Panel>
              ))}
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
