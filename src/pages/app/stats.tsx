import { BookOpen, CheckCircle2, Clock, Flame, Trophy } from 'lucide-react'
import { Bars, Sparkline } from '@/components/charts'
import {
  PageHeading,
  Panel,
  ProgressMeter,
  SectionLabel,
  StatTile,
} from '@/components/ui-kit'
import { sampleStats, sampleTopics } from '@/lib/sample-data'

const TOPIC_HOURS = [28, 24, 20, 16, 12, 24]
const TOPIC_PCT = [22, 19, 16, 13, 10, 20]

export function StatsPage() {
  return (
    <div>
      <PageHeading
        label="Stats"
        title="Stats"
        subtitle="Detailed insights into your learning performance."
      />
      <Panel className="mb-5">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          <StatTile icon={Trophy} value={sampleStats.totalXp.toLocaleString()} label="Total XP" sub="+560" />
          <StatTile icon={BookOpen} value={sampleStats.hoursLearned} label="Hours learned" sub="+18 hrs" />
          <StatTile icon={Clock} value={sampleStats.sessions} label="Sessions" sub="+5" />
          <StatTile icon={CheckCircle2} value={sampleStats.lessonsCompleted} label="Lessons" sub="+9" />
          <StatTile icon={Flame} value={sampleStats.streak} label="Current streak" sub={`Best ${sampleStats.bestStreak}`} />
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionLabel>Learning over time</SectionLabel>
          <div className="mt-5 h-40">
            <Sparkline data={[200, 600, 1000, 1500, 1900, 2400, 2700, 3000, 3240]} />
          </div>
        </Panel>
        <Panel>
          <SectionLabel>Time spent by topic</SectionLabel>
          <div className="mt-5 flex flex-col gap-3">
            {sampleTopics.slice(0, 6).map((t, i) => (
              <div key={t.slug} className="flex items-center gap-3">
                <span className="w-28 truncate font-mono text-xs uppercase">
                  {t.name}
                </span>
                <ProgressMeter value={TOPIC_PCT[i]} />
                <span className="w-12 text-right font-mono text-xs">
                  {TOPIC_HOURS[i]} hrs
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel>
          <SectionLabel>Session history</SectionLabel>
          <div className="mt-5 h-28">
            <Bars data={[40, 90, 60, 30, 70, 55, 80, 45, 95, 60, 75, 50]} />
          </div>
        </Panel>
        <Panel>
          <SectionLabel>Focus score trend</SectionLabel>
          <div className="mt-5 h-28">
            <Sparkline data={[70, 72, 68, 75, 71, 73, 69, 74, 72]} />
          </div>
        </Panel>
        <Panel>
          <SectionLabel>Accuracy over time</SectionLabel>
          <div className="mt-5 h-28">
            <Sparkline data={[62, 68, 72, 65, 78, 74, 80, 76, 82]} />
          </div>
        </Panel>
      </div>
    </div>
  )
}
