import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Gamepad2,
  Target,
} from 'lucide-react'
import { Link } from 'react-router'
import { Bars } from '@/components/charts'
import { Panel, ProgressMeter, SectionLabel, StatTile } from '@/components/ui-kit'
import {
  sampleFocus,
  sampleRecentLessons,
  sampleStats,
  sampleWeekActivity,
} from '@/lib/sample-data'
import { cn } from '@/lib/utils'

const DOT: Record<string, string> = {
  done: 'bg-primary border-primary',
  partial: 'border-primary',
  none: 'border-border',
  missed: 'border-border line-through',
}

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
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

      {/* Stat tiles */}
      <Panel>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatTile icon={Flame} value={sampleStats.streak} label="Day streak" sub="Keep it up" />
          <StatTile icon={Target} value={`${sampleStats.accuracy}%`} label="Avg quiz accuracy" sub="Last 7 days" />
          <StatTile icon={BookOpen} value={sampleStats.hoursLearned} label="Hours learned" sub="All time" />
          <StatTile icon={Gamepad2} value={sampleStats.hoursPlayed} label="Hours played" sub="All time" />
        </div>
      </Panel>

      {/* Current focus + recent lessons */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between">
            <SectionLabel>Current focus</SectionLabel>
            <Link to="/app/topics" className="font-mono text-[10px] tracking-widest text-primary uppercase">
              Add topic +
            </Link>
          </div>
          <div className="mt-5 flex flex-col gap-5">
            {sampleFocus.map((t) => (
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
            {sampleRecentLessons.map((l) => (
              <div key={l.title} className="flex items-center gap-3 py-3">
                <CheckCircle2
                  className={cn(
                    'size-4 shrink-0',
                    l.status === 'done' ? 'text-primary' : 'text-muted-foreground',
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

      {/* Activity + progress chart */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionLabel>7 day activity</SectionLabel>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {sampleWeekActivity.map((status, i) => (
              <span
                key={i}
                className={cn('aspect-square rounded-full border-2', DOT[status])}
              />
            ))}
          </div>
          <div className="mt-5 flex gap-6">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Current streak
              </p>
              <p className="text-2xl font-bold">{sampleStats.streak} days</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Best streak
              </p>
              <p className="text-2xl font-bold">{sampleStats.bestStreak} days</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionLabel>Progress over time</SectionLabel>
          <div className="mt-5 h-32">
            <Bars data={[12, 28, 40, 55, 62, 78, 84, 92, 104, 124]} />
          </div>
          <div className="mt-5 flex justify-between font-mono text-xs">
            <span>
              <span className="text-muted-foreground">TOTAL </span>
              {sampleStats.hoursLearned} hrs
            </span>
            <span>
              <span className="text-muted-foreground">THIS MONTH </span>+18
            </span>
            <span>
              <span className="text-muted-foreground">DAILY AVG </span>2.1
            </span>
          </div>
        </Panel>
      </div>

      {/* Next up */}
      <Panel className="bg-primary text-primary-foreground" brackets={false}>
        <div className="flex flex-col gap-3">
          <SectionLabel className="text-primary-foreground">Next up</SectionLabel>
          <h3 className="text-2xl font-bold uppercase">React State vs Refs</h3>
          <p className="font-mono text-xs opacity-90">
            Lesson · 6 min — Understand when to use state and when to use refs.
          </p>
          <div className="mt-1 h-1.5 w-full bg-primary-foreground/30">
            <div className="h-full w-[65%] bg-primary-foreground" />
          </div>
          <Link
            to="/app/sessions"
            className="mt-2 inline-flex w-fit items-center gap-2 bg-primary-foreground px-4 py-2 font-mono text-xs tracking-widest text-primary uppercase"
          >
            <Clock className="size-3.5" /> Continue lesson — 65%
          </Link>
        </div>
      </Panel>
    </div>
  )
}
