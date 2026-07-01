import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Gamepad2,
  Target,
} from 'lucide-react'
import { Link } from 'react-router'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
import { Panel, ProgressMeter, SectionLabel, StatTile } from '@/components/ui-kit'
import { useAsync } from '@/hooks/use-async'
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
      <Panel className="flex flex-col gap-4 p-8">
        <SectionLabel>Overview</SectionLabel>
        <h1 className="max-w-2xl text-4xl leading-[0.95] font-bold tracking-tight uppercase sm:text-6xl">
          You're building something <span className="text-primary">powerful.</span>
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          Every session makes you stronger.
        </p>
        <Link
          to="/app/sessions"
          className="mt-2 inline-flex w-fit items-center gap-2 bg-primary px-5 py-3 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
        >
          Start learning <ArrowRight className="size-4" />
        </Link>
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
                        <p className="text-sm font-semibold">{t.name}</p>
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
                <div className="mt-5 flex flex-col divide-y divide-border">
                  {recentLessons.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      No lessons yet — your completed lessons will show up here.
                    </p>
                  )}
                  {recentLessons.map((l) => (
                    <div key={l.title} className="flex items-center gap-3 py-3">
                      <CheckCircle2
                        className={cn(
                          'size-4 shrink-0',
                          l.status === 'completed' ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.title}</p>
                        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                          {l.topic} · {l.minutes} min
                        </p>
                      </div>
                      <span className="font-mono text-xs text-primary">
                        {l.score !== null ? `${l.score}%` : 'In progress'}
                      </span>
                    </div>
                  ))}
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
