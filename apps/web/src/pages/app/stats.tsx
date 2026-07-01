import { BookOpen, CheckCircle2, Clock, Flame, Trophy } from 'lucide-react'
import { api } from '@/api-client'
import { ChartPanel } from '@/components/chart-panel'
import { AsyncView } from '@/components/layout/async-view'
import {
  PageHeading,
  Panel,
  ProgressMeter,
  SectionLabel,
  StatTile,
} from '@fw/ui'
import { useAsync } from '@/hooks/use-async'

export function StatsPage() {
  const state = useAsync(() => api.data.stats())
  const series = useAsync(() => api.data.series())

  return (
    <div>
      <PageHeading
        label="Stats"
        title="Stats"
        subtitle="Detailed insights into your learning performance."
      />
      <AsyncView state={state}>
        {({ stats, topics }) => (
          <>
            <Panel className="mb-5">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                <StatTile icon={Trophy} value={stats.totalXp.toLocaleString()} label="Total XP" sub="All time" />
                <StatTile icon={BookOpen} value={stats.hoursLearned} label="Hours learned" sub="All time" />
                <StatTile icon={Clock} value={stats.sessions} label="Sessions" sub="All time" />
                <StatTile icon={CheckCircle2} value={stats.lessonsCompleted} label="Lessons" sub="All time" />
                <StatTile icon={Flame} value={stats.streak} label="Current streak" sub={`Best ${stats.bestStreak}`} />
              </div>
            </Panel>
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel>
                <SectionLabel>Topic progress</SectionLabel>
                <div className="mt-5 flex flex-col gap-3">
                  {topics.length === 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      No topics yet.
                    </p>
                  )}
                  {topics.slice(0, 6).map((t) => (
                    <div key={t.slug} className="flex items-center gap-3">
                      <span className="w-28 truncate font-mono text-xs uppercase">
                        {t.name}
                      </span>
                      <ProgressMeter value={t.pct} />
                      <span className="w-12 text-right font-mono text-xs">{t.pct}%</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel className="flex flex-col justify-center">
                <SectionLabel>Avg quiz accuracy</SectionLabel>
                <p className="mt-4 text-5xl font-bold text-primary tabular-nums">
                  {stats.accuracy}%
                </p>
                <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Across all quizzes
                </p>
                <ProgressMeter value={stats.accuracy} className="mt-4" />
              </Panel>
            </div>
          </>
        )}
      </AsyncView>
      <div className="mt-5">
        <AsyncView state={series}>
          {(s) => (
            <div className="grid gap-5 lg:grid-cols-2">
              <ChartPanel
                label="Accuracy over time"
                data={s.accuracyByDay}
                suffix="%"
              />
              <ChartPanel
                label="Minutes learned"
                data={s.minutesByDay}
                kind="bars"
              />
            </div>
          )}
        </AsyncView>
      </div>
    </div>
  )
}
