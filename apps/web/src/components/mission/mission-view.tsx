import {
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Gamepad2,
  Pause,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Panel } from '@fw/ui'
import { MissionGame } from '@/components/mission/mission-game'
import { ROM_CATALOG } from '@/lib/rom-catalog'
import { cn } from '@/lib/utils'

const TOBU = ROM_CATALOG.find((g) => g.id === 'tobu-tobu-girl')

// The "mission in progress" screen the launcher morphs into: a mission bar, the
// game stage (poster placeholder until the live embed is wired), a MISSION
// CONTROL panel, and the session-progress timeline. Theme-aware panels; the game
// stage stays dark (it's a game screen). Content is mock-accurate placeholder
// for now — real session data gets threaded in once the morph lands.
export function MissionView({ onPause }: { onPause?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <MissionBar onPause={onPause} />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <GameStage />
        <MissionControl />
      </div>
      <SessionProgress />
    </div>
  )
}

function Label({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

function MissionBar({ onPause }: { onPause?: () => void }) {
  return (
    <Panel brackets={false} className="rounded-2xl p-0">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 p-4 md:px-6 md:py-5">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <Label>Mission</Label>
            <div className="font-heading text-2xl leading-none font-bold text-foreground">
              01
            </div>
          </div>
          <div className="h-9 w-px bg-border" />
          <div>
            <div className="font-heading text-lg font-bold tracking-wide text-foreground uppercase">
              Tobu Tobu Girl
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              Arcade · Platformer
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="min-w-[9rem]">
            <Label>Play time left</Label>
            <div className="font-mono text-xl font-bold tabular-nums text-foreground">
              18:42
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
          </div>
          <div>
            <Label>Round</Label>
            <div className="font-mono text-xl font-bold tabular-nums text-foreground">
              1 <span className="text-muted-foreground">/ 3</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onPause}
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 font-mono text-xs font-semibold tracking-widest text-foreground uppercase transition-colors hover:border-primary hover:text-primary"
        >
          <Pause className="size-4" />
          Pause Session
        </button>
      </div>
    </Panel>
  )
}

function GameStage() {
  return (
    <Panel
      brackets={false}
      className="relative flex min-h-[24rem] flex-col overflow-hidden rounded-2xl bg-neutral-950 p-5"
    >
      <div className="flex items-center justify-between">
        <span className="font-heading text-lg font-bold tracking-wide text-white uppercase">
          Tobu Tobu Girl
        </span>
        <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
          Arrow keys · Z / X
        </span>
      </div>

      {/* The live game, centered at the Game Boy aspect ratio (160x144 = 10:9);
          fills the stage width up to a generous cap, so it scales down cleanly on
          narrow screens. */}
      <div className="flex flex-1 items-center justify-center py-4">
        {TOBU ? (
          <div className="aspect-[10/9] w-full max-w-[42rem] overflow-hidden rounded-md border border-white/10">
            <MissionGame rom={TOBU} />
          </div>
        ) : (
          <span className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] tracking-wide text-white/40">
            Game unavailable
          </span>
        )}
      </div>
    </Panel>
  )
}

function MissionControl() {
  return (
    <Panel brackets={false} className="rounded-2xl p-5">
      <div className="flex flex-col gap-5">
        <span className="font-heading text-sm font-bold tracking-widest text-foreground uppercase">
          Mission Control
        </span>

        <div>
          <Label>Current skill</Label>
          <button
            type="button"
            className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5 text-left transition-colors hover:border-primary/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-yellow-400 font-heading text-xs font-bold text-black">
              JS
            </span>
            <span className="flex-1 font-heading text-sm font-bold text-foreground">
              JavaScript Basics
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        <div>
          <Label>Difficulty</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              Beginner
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    'size-4',
                    i === 0
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-muted-foreground/40',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Round goal</Label>
          <p className="mt-1.5 font-mono text-sm text-foreground">
            Survive and collect the flag
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Reach the goal to continue.
          </p>
        </div>

        <div className="border-t border-border" />

        <div>
          <Label>Up next: learn time</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-primary" />
            <span className="flex-1 font-mono text-sm text-foreground">
              JavaScript Functions
            </span>
            <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              5 min lesson
            </span>
          </div>
        </div>

        <div>
          <Label>Estimated reward</Label>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <span className="font-heading text-xl font-bold text-blue-600 dark:text-blue-400">
              +200
              <span className="ml-1 font-mono text-sm text-muted-foreground">
                XP
              </span>
            </span>
            <Histogram />
          </div>
        </div>
      </div>
    </Panel>
  )
}

const BARS = [30, 25, 35, 45, 40, 55, 50, 65, 75, 70, 85, 100]

function Histogram() {
  return (
    <div className="flex h-6 items-end gap-0.5">
      {BARS.map((h, i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

const STEPS: { icon: LucideIcon; label: string; time?: string; active?: boolean }[] =
  [
    { icon: Gamepad2, label: 'Play', time: '18:42', active: true },
    { icon: Code, label: 'Learn', time: '5:00' },
    { icon: Gamepad2, label: 'Play', time: '18:00' },
    { icon: Code, label: 'Learn', time: '5:00' },
    { icon: Gamepad2, label: 'Play', time: '18:00' },
    { icon: Trophy, label: 'Complete' },
  ]

function SessionProgress() {
  return (
    <Panel brackets={false} className="rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Label>Session progress</Label>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
      <div className="mt-4 flex items-center">
        {STEPS.map((s, i) => (
          <Fragment key={i}>
            <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border',
                  s.active
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                <s.icon className="size-4" />
              </span>
              <div className="leading-tight">
                <div
                  className={cn(
                    'font-mono text-[11px]',
                    s.active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </div>
                {s.time && (
                  <div
                    className={cn(
                      'font-mono text-[11px] tabular-nums',
                      s.active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {s.time}
                  </div>
                )}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-2 mb-6 h-px flex-1 bg-border" />
            )}
          </Fragment>
        ))}
      </div>
    </Panel>
  )
}
