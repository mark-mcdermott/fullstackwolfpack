import {
  CheckCircle2,
  Circle,
  FileText,
  LogOut,
  Pause,
  SkipForward,
  TrendingUp,
} from 'lucide-react'
import { Panel, ProgressMeter, SectionLabel, StatTile } from '@/components/ui-kit'
import { Flame, Target, Zap } from 'lucide-react'
import { sampleSessionPlan } from '@/lib/sample-data'
import { cn } from '@/lib/utils'

export function SessionsPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Active session header */}
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <Panel>
          <SectionLabel>Active session</SectionLabel>
          <h1 className="mt-2 text-3xl font-bold uppercase">TypeScript Generics</h1>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Lesson 03 of 08 · est. 6 min
          </p>
          <p className="mt-3 max-w-md font-mono text-sm text-muted-foreground">
            Learn how to create reusable, type-safe components with generics in
            TypeScript.
          </p>
        </Panel>
        <Panel className="flex flex-col justify-between gap-3">
          <SectionLabel>Session timer</SectionLabel>
          <p className="font-mono text-5xl font-bold text-primary tabular-nums">
            14:27
          </p>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Focus time remaining
          </p>
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Session goal · 10 min play // 10 min learn
            </p>
            <ProgressMeter value={55} className="mt-2" />
          </div>
        </Panel>
      </div>

      {/* Session stats */}
      <Panel>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatTile icon={Target} value="82" label="Focus score" sub="Good focus" />
          <StatTile icon={Flame} value="7" label="Current streak" sub="Days" />
          <StatTile icon={Zap} value="+15%" label="Streak bonus" sub="XP boost" />
          <StatTile icon={TrendingUp} value="3 / 5" label="Lessons today" sub="Keep going" />
        </div>
      </Panel>

      {/* Lesson + plan */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel>
          <SectionLabel>Lesson</SectionLabel>
          <h2 className="mt-3 text-xl font-bold uppercase">Understanding Generics</h2>
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            Generics allow you to create components that work with any data type
            while maintaining type safety.
          </p>
          <pre className="mt-4 overflow-x-auto bg-foreground p-4 font-mono text-xs text-background">
            {`function identity<T>(arg: T): T {\n  return arg\n}`}
          </pre>
          <button
            type="button"
            className="mt-4 bg-primary px-4 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            Continue lesson →
          </button>
        </Panel>

        <Panel>
          <SectionLabel>Session plan</SectionLabel>
          <ol className="mt-4 flex flex-col gap-3">
            {sampleSessionPlan.map((s) => (
              <li key={s.n} className="flex items-center gap-3">
                {s.done ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'flex-1 font-mono text-xs',
                    s.active && 'text-primary',
                  )}
                >
                  {s.n}. {s.title}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {s.minutes} min
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 border-t border-border pt-4">
            <SectionLabel>Controls</SectionLabel>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                [Pause, 'Pause'],
                [SkipForward, 'Skip'],
                [FileText, 'Notes'],
                [LogOut, 'Exit'],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Pause
                return (
                  <button
                    key={label as string}
                    type="button"
                    className="flex flex-col items-center gap-1 border border-border py-2 font-mono text-[10px] tracking-widest uppercase hover:bg-muted"
                  >
                    <I className="size-4" />
                    {label as string}
                  </button>
                )
              })}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
