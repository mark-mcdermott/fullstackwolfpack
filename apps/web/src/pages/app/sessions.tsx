import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
import { FocusSession } from '@/components/focus/focus-session'
import { RecentLessons } from '@/components/learn/recent-lessons'
import { PageHeading, Panel, ProgressMeter, SectionLabel } from '@fw/ui'
import type { TopicProgress } from '@/core/app-data'
import { useAsync } from '@/hooks/use-async'
import { nextLessonPath } from '@/lib/open-course'

function ContinueButton({ topic }: { topic: TopicProgress }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setBusy(true)
    setError(null)
    try {
      navigate(await nextLessonPath(topic.slug))
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? e.message : 'Could not open the course')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="bg-primary px-4 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Opening…' : topic.lessonsCompleted > 0 ? 'Continue →' : 'Start →'}
      </button>
      {error && (
        <span className="font-mono text-[10px] text-destructive">{error}</span>
      )}
    </div>
  )
}

export function SessionsPage() {
  const state = useAsync(() => api.data.dashboard())

  return (
    <div>
      <PageHeading
        label="Sessions"
        title="Sessions"
        subtitle="Short lessons, one at a time — pick up right where you left off."
      />
      <div className="flex flex-col gap-5">
        <FocusSession />
        <AsyncView state={state}>
        {({ focus, recentLessons }) => {
          const active = focus.filter((t) => t.lessonsTotal > 0)
          return (
            <div className="flex flex-col gap-5">
              <Panel>
                <SectionLabel>Jump back in</SectionLabel>
                <div className="mt-5 flex flex-col gap-5">
                  {active.length === 0 ? (
                    <div className="flex flex-col items-start gap-3">
                      <p className="font-mono text-[10px] text-muted-foreground">
                        No active courses yet — generate one from a topic to start
                        learning.
                      </p>
                      <Link
                        to="/app/topics"
                        className="inline-flex items-center gap-2 bg-primary px-4 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
                      >
                        Browse topics <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ) : (
                    active.map((t) => (
                      <div key={t.slug} className="flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                            {t.lessonsCompleted} / {t.lessonsTotal} lessons
                          </p>
                        </div>
                        <div className="hidden w-32 sm:block">
                          <ProgressMeter value={t.pct} />
                        </div>
                        <ContinueButton topic={t} />
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              <Panel>
                <div className="flex items-center justify-between">
                  <SectionLabel>Recent lessons</SectionLabel>
                  <Link
                    to="/app/topics"
                    className="font-mono text-[10px] tracking-widest text-primary uppercase"
                  >
                    All topics →
                  </Link>
                </div>
                <div className="mt-5">
                  <RecentLessons
                    lessons={recentLessons}
                    emptyText="Your completed lessons will show up here."
                  />
                </div>
              </Panel>
            </div>
          )
        }}
        </AsyncView>
      </div>
    </div>
  )
}
