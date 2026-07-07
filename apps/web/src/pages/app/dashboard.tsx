import { ArrowRight, BookOpen, Flame, Gamepad2, Target } from 'lucide-react'
import { Link } from 'react-router'
import { api } from '@/api-client'
import { SessionLauncher } from '@/components/launch/session-launcher'
import { AsyncView } from '@/components/layout/async-view'
import { RecentLessons } from '@/components/learn/recent-lessons'
import { Panel, ProgressMeter, SectionLabel, StatTile } from '@fw/ui'
import { WolfSun } from '@fw/ui'
import { useAsync } from '@/hooks/use-async'
import { topicCoursePath } from '@/lib/open-course'
import { cn } from '@/lib/utils'

// daily_activity status → dot styling.
const DOT: Record<string, string> = {
  completed: 'bg-primary border-primary',
  partial: 'border-primary',
  missed: 'border-border line-through',
}

export function DashboardPage() {
  const state = useAsync(() => api.data.dashboard())

  return (
    <div className="flex flex-col gap-5">
      <SessionLauncher />
      <Panel className="p-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <SectionLabel>Overview</SectionLabel>
            <h1 className="max-w-2xl text-4xl leading-[0.95] font-semibold tracking-tight uppercase sm:text-6xl">
              You're building something{' '}
              <span className="text-primary">powerful.</span>
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Every session makes you stronger.
            </p>
            <Link
              to="/app/topics"
              className="mt-2 inline-flex w-fit items-center gap-2 border border-border px-5 py-3 font-mono text-xs tracking-widest uppercase hover:border-muted-foreground"
            >
              Browse topics <ArrowRight className="size-4" />
            </Link>
          </div>
          <WolfSun className="hidden w-56 shrink-0 md:block" />
        </div>
      </Panel>

      <AsyncView state={state}>
        {({ stats, focus, recentLessons, weekActivity }) => (
          <>
            <Panel>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <StatTile icon={Flame} value={stats.streak} label="Day streak" sub="Keep it up" />
                <StatTile icon={Target} value={`${stats.accuracy}%`} label="Avg quiz accuracy" sub="All time" />
                <StatTile icon={BookOpen} value={stats.hoursLearned} label="Hours learned" sub="All time" />
                <StatTile icon={Gamepad2} value={stats.hoursPlayed} label="Hours played" sub="All time" />
              </div>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel>
                <div className="flex items-center justify-between">
                  <SectionLabel>Current focus</SectionLabel>
                  <Link to="/app/topics" className="font-mono text-[10px] tracking-widest text-primary uppercase">
                    Add topic +
                  </Link>
                </div>
                <div className="mt-5 flex flex-col gap-5">
                  {focus.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      No active topics yet — add one to start a track.
                    </p>
                  )}
                  {focus.map((t) => (
                    <div key={t.slug} className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={topicCoursePath(t.slug)}
                          className="block w-fit max-w-full truncate text-sm font-semibold transition-colors hover:text-primary"
                        >
                          {t.name}
                        </Link>
                        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                          {t.difficulty}
                        </p>
                      </div>
                      <div className="w-32">
                        <ProgressMeter value={t.pct} />
                      </div>
                      <span className="w-8 text-right font-mono text-xs">{t.pct}%</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel>
                <div className="flex items-center justify-between">
                  <SectionLabel>Recent lessons</SectionLabel>
                  <Link to="/app/progress" className="font-mono text-[10px] tracking-widest text-primary uppercase">
                    View all →
                  </Link>
                </div>
                <div className="mt-5">
                  <RecentLessons
                    lessons={recentLessons}
                    emptyText="No lessons yet — your completed lessons will show up here."
                  />
                </div>
              </Panel>
            </div>

            <Panel>
              <SectionLabel>Activity</SectionLabel>
              {weekActivity.length === 0 ? (
                <p className="mt-5 font-mono text-[10px] text-muted-foreground">
                  No activity logged yet — complete a session to start your streak.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {weekActivity.map((status, i) => (
                    <span
                      key={i}
                      className={cn('aspect-square rounded-full border-2', DOT[status] ?? 'border-border')}
                    />
                  ))}
                </div>
              )}
              <div className="mt-5 flex gap-6">
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    Current streak
                  </p>
                  <p className="text-2xl font-bold">{stats.streak} days</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    Best streak
                  </p>
                  <p className="text-2xl font-bold">{stats.bestStreak} days</p>
                </div>
              </div>
            </Panel>
          </>
        )}
      </AsyncView>
    </div>
  )
}
