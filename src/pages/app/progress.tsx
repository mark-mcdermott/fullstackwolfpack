import { BookOpen, Flame, TrendingUp, Trophy } from 'lucide-react'
import { api } from '@/api-client'
import { ChartPanel } from '@/components/chart-panel'
import { AsyncView } from '@/components/layout/async-view'
import {
  PageHeading,
  Panel,
  ProgressMeter,
  SectionLabel,
  StatTile,
} from '@/components/ui-kit'
import { relativeTime } from '@/core/progress'
import { useAsync } from '@/hooks/use-async'

export function ProgressPage() {
  const state = useAsync(() => api.data.progress())
  const series = useAsync(() => api.data.series())

  return (
    <div>
      <PageHeading
        label="Progress"
        title="Progress"
        subtitle="Track your learning journey and see how far you've come."
      />
      <AsyncView state={state}>
        {({ stats, topics, skills, activity }) => (
          <>
            <Panel className="mb-5">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <StatTile icon={Trophy} value={stats.totalXp.toLocaleString()} label="Total XP" sub="All time" />
                <StatTile icon={BookOpen} value={stats.hoursLearned} label="Hours learned" sub="All time" />
                <StatTile icon={TrendingUp} value={stats.lessonsCompleted} label="Lessons completed" sub="All time" />
                <StatTile icon={Flame} value={stats.streak} label="Current streak" sub={`Best: ${stats.bestStreak} days`} />
              </div>
            </Panel>

            <div className="mb-5">
              <AsyncView state={series}>
                {(s) => <ChartPanel label="XP over time" data={s.xpCumulative} />}
              </AsyncView>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel>
                <SectionLabel>Topic progress</SectionLabel>
                <div className="mt-5 flex flex-col gap-3">
                  {topics.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      No topics yet.
                    </p>
                  )}
                  {topics.slice(0, 8).map((t) => (
                    <div key={t.slug} className="flex items-center gap-3">
                      <span className="w-28 truncate font-mono text-xs uppercase">
                        {t.name}
                      </span>
                      <ProgressMeter value={t.pct} />
                      <span className="w-8 text-right font-mono text-xs">{t.pct}%</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <SectionLabel>Skills overview</SectionLabel>
                <div className="mt-5 flex flex-col gap-3">
                  {skills.length === 0 ? (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Skills build up as you complete lessons and quizzes.
                    </p>
                  ) : (
                    skills.map((s) => (
                      <div key={s.key} className="flex items-center gap-3">
                        <span className="w-32 font-mono text-xs uppercase">{s.key}</span>
                        <ProgressMeter value={s.value} />
                        <span className="w-8 text-right font-mono text-xs">{s.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>

            <div className="mt-5">
              <Panel>
                <SectionLabel>Recent activity</SectionLabel>
                <div className="mt-5 flex flex-col divide-y divide-border">
                  {activity.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      No activity yet — earn XP to fill this in.
                    </p>
                  )}
                  {activity.map((a, i) => (
                    <div key={`${a.title}-${i}`} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{a.title}</p>
                        {a.topic && (
                          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                            {a.topic}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {relativeTime(a.at)}
                      </span>
                      <span className="font-mono text-xs text-primary">+{a.xp} XP</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
      </AsyncView>
    </div>
  )
}
