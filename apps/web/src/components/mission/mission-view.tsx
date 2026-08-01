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
import { FocusLessonOverlay } from '@/components/focus/focus-lesson-overlay'
import { MissionGame } from '@/components/mission/mission-game'
import type { Difficulty } from '@/core/generation'
import { useTimer } from '@/hooks/timer-context'
import { ROM_CATALOG } from '@/lib/rom-catalog'
import { cn } from '@/lib/utils'

// The chosen session, handed over by the launcher (or the hero's quick-start).
export type MissionSession = {
  gameId: string
  gameTitle: string
  skillName: string
  topicSlug: string
  difficulty: Difficulty
  playMinutes: number
  learnMinutes: number
  learnFirst: boolean
  estimatedXp: number
}

// The hero "Start your first mission" quick-start uses these (mirrors the guest
// launcher's defaults) when no explicit selection is handed over.
export const DEFAULT_SESSION: MissionSession = {
  gameId: 'tobu-tobu-girl',
  gameTitle: 'Tobu Tobu Girl',
  skillName: 'JavaScript',
  topicSlug: 'javascript',
  difficulty: 'intermediate',
  playMinutes: 25,
  learnMinutes: 5,
  learnFirst: false,
  estimatedXp: 240,
}

const DIFF_STARS: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 3,
  advanced: 5,
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

// The "mission in progress" screen the launcher morphs into: a mission bar, the
// live game stage, a MISSION CONTROL panel, and the session-progress timeline.
// Theme-aware panels; the game stage stays dark (it's a game screen).
export function MissionView({
  session,
  onPause,
}: {
  session: MissionSession
  onPause?: () => void
}) {
  const timer = useTimer()
  const learnPhase = timer.active && timer.step?.phase === 'learn'

  return (
    <div className="flex flex-col gap-4">
      <MissionBar
        session={session}
        secondsLeft={timer.active ? timer.secondsLeft : session.playMinutes * 60}
        round={timer.active ? timer.currentRound : 1}
        rounds={timer.active ? timer.rounds : 3}
        onPause={onPause}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <GameStage session={session} paused={learnPhase} />
        <MissionControl session={session} onOpenLesson={timer.skip} />
      </div>
      <SessionProgress session={session} />

      {/* At 0:00 (or via the skill chevron) the timer flips to the learn phase:
          the game pauses and the real lesson takes over full-screen. */}
      {learnPhase && <FocusLessonOverlay onResume={timer.skip} />}
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

function MissionBar({
  session,
  secondsLeft,
  round,
  rounds,
  onPause,
}: {
  session: MissionSession
  secondsLeft: number
  round: number
  rounds: number
  onPause?: () => void
}) {
  const total = session.playMinutes * 60
  const elapsed =
    total > 0 ? Math.max(0, Math.min(100, (1 - secondsLeft / total) * 100)) : 0

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
              {session.gameTitle}
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
              {mmss(secondsLeft)}
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                style={{ width: `${elapsed}%` }}
              />
            </div>
          </div>
          <div>
            <Label>Round</Label>
            <div className="font-mono text-xl font-bold tabular-nums text-foreground">
              {round} <span className="text-muted-foreground">/ {rounds}</span>
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

function GameStage({
  session,
  paused,
}: {
  session: MissionSession
  paused: boolean
}) {
  const rom = ROM_CATALOG.find((g) => g.id === session.gameId)
  return (
    <Panel
      brackets={false}
      className="relative flex min-h-[24rem] flex-col overflow-hidden rounded-2xl bg-neutral-950 p-5"
    >
      <div className="flex items-center justify-between">
        <span className="font-heading text-lg font-bold tracking-wide text-white uppercase">
          {session.gameTitle}
        </span>
        <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
          Arrow keys · Z / X
        </span>
      </div>

      {/* The live game + its touch controls (on touch devices). */}
      <div className="flex flex-1 items-center justify-center py-4">
        {rom ? (
          <MissionGame rom={rom} paused={paused} />
        ) : (
          <span className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] tracking-wide text-white/40">
            Game unavailable
          </span>
        )}
      </div>
    </Panel>
  )
}

function MissionControl({
  session,
  onOpenLesson,
}: {
  session: MissionSession
  onOpenLesson: () => void
}) {
  const stars = DIFF_STARS[session.difficulty]
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
            onClick={onOpenLesson}
            className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5 text-left transition-colors hover:border-primary/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-yellow-400 font-heading text-xs font-bold text-black">
              JS
            </span>
            <span className="flex-1 font-heading text-sm font-bold text-foreground">
              {session.skillName}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        <div>
          <Label>Difficulty</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {cap(session.difficulty)}
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    'size-4',
                    i < stars
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
              {session.skillName} Functions
            </span>
            <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {session.learnMinutes} min lesson
            </span>
          </div>
        </div>

        <div>
          <Label>Estimated reward</Label>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <span className="font-heading text-xl font-bold text-blue-600 dark:text-blue-400">
              +{session.estimatedXp}
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

function SessionProgress({ session }: { session: MissionSession }) {
  const play = mmss(session.playMinutes * 60)
  const learn = mmss(session.learnMinutes * 60)
  const steps: { icon: LucideIcon; label: string; time?: string; active?: boolean }[] =
    [
      { icon: Gamepad2, label: 'Play', time: play, active: true },
      { icon: Code, label: 'Learn', time: learn },
      { icon: Gamepad2, label: 'Play', time: play },
      { icon: Code, label: 'Learn', time: learn },
      { icon: Gamepad2, label: 'Play', time: play },
      { icon: Trophy, label: 'Complete' },
    ]
  return (
    <Panel brackets={false} className="rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Label>Session progress</Label>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-[34rem] items-center">
          {steps.map((s, i) => (
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
            {i < steps.length - 1 && (
              <div className="mx-2 mb-6 h-px flex-1 bg-border" />
            )}
          </Fragment>
        ))}
        </div>
      </div>
    </Panel>
  )
}
