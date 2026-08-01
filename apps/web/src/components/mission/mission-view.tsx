import {
  ChevronRight,
  Circle,
  CircleCheck,
  CircleDot,
  Code,
  Gamepad2,
  Pause,
  Play,
  SkipForward,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react'
import { type ReactNode } from 'react'
import { Panel } from '@fw/ui'
import { LessonStage } from '@/components/mission/lesson-stage'
import { MissionGame } from '@/components/mission/mission-game'
import { SessionProgress } from '@/components/mission/session-progress'
import type { Difficulty } from '@/core/generation'
import type { FocusPhase } from '@/core/focus-session'
import { useTimer } from '@/hooks/timer-context'
import { useMissionLessonToc } from '@/lib/mission-lesson-store'
import { type MissionSession } from '@/lib/mission'
import { ROM_CATALOG } from '@/lib/rom-catalog'
import { cn } from '@/lib/utils'

export { DEFAULT_SESSION } from '@/lib/mission'
export type { MissionSession } from '@/lib/mission'

const DIFF_STARS: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 3,
  advanced: 5,
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

// The "mission in progress" screen the launcher morphs into. One frame holds the
// whole play↔learn loop: a phase-aware bar, the center stage (game during play,
// the lesson during learn — the game stays mounted + paused behind it), the
// Mission Control narrator, and the clickable session-progress rail. `onExit`
// ends the session and morphs back to the launcher.
export function MissionView({
  session,
  onExit,
}: {
  session: MissionSession
  onExit?: () => void
}) {
  const timer = useTimer()
  const phase: FocusPhase | null = timer.active ? (timer.step?.phase ?? null) : null
  const learnPhase = phase === 'learn'
  const paused = timer.active && timer.paused
  const phaseTotal = timer.step ? timer.step.seconds : session.playMinutes * 60

  return (
    <div className="flex flex-col gap-4">
      <MissionBar
        session={session}
        phase={phase}
        secondsLeft={timer.active ? timer.secondsLeft : session.playMinutes * 60}
        phaseTotal={phaseTotal}
        round={timer.active ? timer.currentRound : 1}
        rounds={timer.active ? timer.rounds : 3}
        paused={paused}
        onSkip={timer.skip}
        onPauseToggle={paused ? timer.resume : timer.pause}
        onExit={onExit}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="relative min-w-0">
          {/* The game stays mounted the whole session so its state is preserved.
              During learn we take it out of the layout (the lesson takes the
              stage) but keep it *rendered* — off-screen with `display:none`
              loses the WebGL context and the game comes back black, so instead
              it sits behind, transparent, at its natural size. */}
          <div
            className={cn(
              learnPhase &&
                'pointer-events-none absolute top-0 left-0 -z-10 w-full opacity-0',
            )}
          >
            <GameStage session={session} paused={learnPhase || paused} />
          </div>
          {learnPhase && <LessonStage onResume={timer.skip} />}
        </div>
        <MissionControl session={session} phase={phase} onSkip={timer.skip} />
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

function BarButton({
  onClick,
  icon: Icon,
  children,
  className,
  ariaLabel,
}: {
  onClick?: () => void
  icon: LucideIcon
  children?: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 font-mono text-xs font-semibold tracking-widest text-foreground uppercase transition-colors hover:border-primary hover:text-primary',
        className,
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  )
}

function MissionBar({
  session,
  phase,
  secondsLeft,
  phaseTotal,
  round,
  rounds,
  paused,
  onSkip,
  onPauseToggle,
  onExit,
}: {
  session: MissionSession
  phase: FocusPhase | null
  secondsLeft: number
  phaseTotal: number
  round: number
  rounds: number
  paused: boolean
  onSkip: () => void
  onPauseToggle: () => void
  onExit?: () => void
}) {
  const learn = phase === 'learn'
  const elapsed =
    phaseTotal > 0
      ? Math.max(0, Math.min(100, (1 - secondsLeft / phaseTotal) * 100))
      : 0

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
              {learn ? `Learning · ${session.skillName}` : 'Arcade · Platformer'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="min-w-[9rem]">
            <Label>{learn ? 'Learn time left' : 'Play time left'}</Label>
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

        <div className="ml-auto flex items-center gap-2">
          <BarButton icon={SkipForward} onClick={onSkip}>
            <span className="hidden sm:inline">
              Skip to {learn ? 'Play' : 'Learning'}
            </span>
          </BarButton>
          <BarButton
            icon={paused ? Play : Pause}
            onClick={onPauseToggle}
            className={cn(paused && 'border-primary text-primary')}
          >
            {paused ? 'Resume' : 'Pause'}
          </BarButton>
          <BarButton
            icon={X}
            onClick={onExit}
            ariaLabel="Take a break — resume later"
            className="px-2.5 text-muted-foreground"
          />
        </div>
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

// One persistent panel that narrates the whole loop: what you're doing now and
// what's up next, re-pointed at the active phase. The primary action advances to
// the next phase (skip) — "start learning" during play, "back to the game"
// during learn.
function MissionControl({
  session,
  phase,
  onSkip,
}: {
  session: MissionSession
  phase: FocusPhase | null
  onSkip: () => void
}) {
  const stars = DIFF_STARS[session.difficulty]
  const learn = phase === 'learn'

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
            onClick={onSkip}
            className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5 text-left transition-colors hover:border-primary/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-yellow-400 font-heading text-xs font-bold text-black">
              JS
            </span>
            <span className="flex-1 font-heading text-sm font-bold text-foreground">
              {session.skillName}
            </span>
            {learn ? (
              <Play className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
          </button>
        </div>

        {learn ? (
          <LessonToc />
        ) : (
          <div>
            <Label>Now playing</Label>
            <p className="mt-1.5 font-mono text-sm text-foreground">
              Survive and collect the flag
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {cap(session.difficulty)}
              </span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-3.5',
                      i < stars
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-transparent text-muted-foreground/40',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        <div>
          <Label>Up next</Label>
          <button
            type="button"
            onClick={onSkip}
            className="group mt-1.5 flex w-full items-center gap-2 text-left"
          >
            {learn ? (
              <Gamepad2 className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Code className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 font-mono text-sm text-foreground transition-colors group-hover:text-primary">
              {learn ? 'Back to the game' : `${session.skillName} Functions`}
            </span>
            <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {learn
                ? `${session.playMinutes} min`
                : `${session.learnMinutes} min lesson`}
            </span>
          </button>
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

// The live lesson table of contents, fed by the embedded lesson player: each
// section marked done / current / upcoming so you can see where you are in the
// lesson at a glance.
function LessonToc() {
  const toc = useMissionLessonToc()
  if (!toc) {
    return (
      <div>
        <Label>This lesson</Label>
        <p className="mt-1.5 font-mono text-sm text-muted-foreground">
          Loading sections…
        </p>
      </div>
    )
  }
  const done = toc.segments.filter((_, i) => i < toc.index).length
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <Label>This lesson</Label>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {done}/{toc.segments.length}
        </span>
      </div>
      <p className="mt-1.5 font-heading text-sm font-bold text-foreground">
        {toc.title}
      </p>
      <ul className="mt-2.5 flex flex-col gap-2">
        {toc.segments.map((seg, i) => {
          const isDone = i < toc.index
          const isCurrent = i === toc.index
          const Icon = isDone ? CircleCheck : isCurrent ? CircleDot : Circle
          return (
            <li key={seg.id} className="flex items-start gap-2">
              <Icon
                className={cn(
                  'mt-px size-3.5 shrink-0',
                  isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isCurrent
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground/40',
                )}
              />
              <span
                className={cn(
                  'font-mono text-xs leading-tight',
                  isCurrent
                    ? 'font-semibold text-foreground'
                    : isDone
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60',
                )}
              >
                {seg.title}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
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
