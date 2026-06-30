import { BookOpen, Flame, TrendingUp, Trophy } from 'lucide-react'
import { Sparkline } from '@/components/charts'
import {
  PageHeading,
  Panel,
  ProgressMeter,
  SectionLabel,
  StatTile,
} from '@/components/ui-kit'
import {
  sampleActivity,
  sampleSkills,
  sampleStats,
  sampleTopics,
} from '@/lib/sample-data'

export function ProgressPage() {
  return (
    <div>
      <PageHeading
        label="Progress"
        title="Progress"
        subtitle="Track your learning journey and see how far you've come."
      />
      <Panel className="mb-5">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatTile icon={Trophy} value={sampleStats.totalXp.toLocaleString()} label="Total XP" sub="+560 vs prev 30 days" />
          <StatTile icon={BookOpen} value={sampleStats.hoursLearned} label="Hours learned" sub="+18 hrs" />
          <StatTile icon={TrendingUp} value={sampleStats.lessonsCompleted} label="Lessons completed" sub="+9" />
          <StatTile icon={Flame} value={sampleStats.streak} label="Current streak" sub={`Best: ${sampleStats.bestStreak} days`} />
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionLabel>XP over time</SectionLabel>
          <div className="mt-5 h-40">
            <Sparkline data={[200, 500, 1000, 1400, 1900, 2100, 2700, 3000, 3240]} />
          </div>
        </Panel>
        <Panel>
          <SectionLabel>Topic progress</SectionLabel>
          <div className="mt-5 flex flex-col gap-3">
            {sampleTopics.slice(0, 8).map((t) => (
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
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionLabel>Skills overview</SectionLabel>
          <div className="mt-5 flex flex-col gap-3">
            {sampleSkills.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-32 font-mono text-xs uppercase">{s.key}</span>
                <ProgressMeter value={s.value} />
                <span className="w-8 text-right font-mono text-xs">{s.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionLabel>Recent activity</SectionLabel>
          <div className="mt-5 flex flex-col divide-y divide-border">
            {sampleActivity.map((a) => (
              <div key={a.title} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.title}</p>
                  {a.topic && (
                    <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                      {a.topic}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {a.when}
                </span>
                <span className="font-mono text-xs text-primary">+{a.xp} XP</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
