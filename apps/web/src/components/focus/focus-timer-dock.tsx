import {
  BookOpen,
  Gamepad2,
  Pause,
  Play,
  SkipForward,
  Square,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { ProgressMeter } from '@fw/ui'
import { formatClock } from '@/core/focus-session'
import { useTimer } from '@/hooks/timer-context'

function DockButton({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: typeof Pause
  label: string
  onClick: () => void
  tone?: 'default' | 'destructive'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        tone === 'destructive'
          ? 'flex size-8 items-center justify-center border border-destructive text-destructive hover:bg-destructive/10'
          : 'flex size-8 items-center justify-center border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
      }
    >
      <Icon className="size-3.5" />
    </button>
  )
}

// A persistent focus timer that follows the user across the app. It lives in
// AppLayout so it survives route changes; the Sessions page shows the full-size
// version, so the dock stays out of the way there.
export function FocusTimerDock() {
  const timer = useTimer()
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === '/app/sessions') return null

  if (!timer.active && timer.result) {
    return (
      <div className="fixed top-[4.75rem] right-3 z-40 w-60 border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:right-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">
            Session complete
          </p>
          <button
            type="button"
            onClick={timer.dismiss}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {timer.result.playMinutes}m played · {timer.result.learnMinutes}m
          learned
          {timer.earnedXp !== null && (
            <span className="text-primary"> · +{timer.earnedXp} XP</span>
          )}
        </p>
      </div>
    )
  }

  if (!timer.active || !timer.step) return null

  const isPlay = timer.step.phase === 'play'
  const pct =
    timer.step.seconds > 0
      ? Math.round(
          ((timer.step.seconds - timer.secondsLeft) / timer.step.seconds) * 100,
        )
      : 0

  return (
    <div className="fixed top-[4.75rem] right-3 z-40 w-60 border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:right-4">
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-widest uppercase">
        <span className="flex items-center gap-1.5 text-primary">
          {isPlay ? (
            <Gamepad2 className="size-3.5" />
          ) : (
            <BookOpen className="size-3.5" />
          )}
          {isPlay ? 'Play' : 'Learn'}
          {timer.paused && <span className="text-muted-foreground">· paused</span>}
        </span>
        <span className="text-muted-foreground">
          {timer.currentRound}/{timer.rounds}
        </span>
      </div>

      <p className="mt-2 font-mono text-3xl font-bold tabular-nums">
        {formatClock(timer.secondsLeft)}
      </p>

      <div className="mt-2">
        <ProgressMeter value={pct} />
      </div>

      <button
        type="button"
        onClick={() => navigate(isPlay ? '/app/arcade' : '/app/topics')}
        className="mt-3 flex w-full items-center justify-center gap-2 bg-primary px-3 py-2 font-mono text-[10px] tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
      >
        {isPlay ? <Gamepad2 className="size-3.5" /> : <BookOpen className="size-3.5" />}
        {isPlay ? 'Play now' : 'Learn now'}
      </button>

      <div className="mt-2 flex items-center justify-center gap-2">
        <DockButton
          icon={timer.paused ? Play : Pause}
          label={timer.paused ? 'Resume' : 'Pause'}
          onClick={() => (timer.paused ? timer.resume() : timer.pause())}
        />
        <DockButton icon={SkipForward} label="Skip" onClick={timer.skip} />
        <DockButton
          icon={Square}
          label="End"
          onClick={timer.end}
          tone="destructive"
        />
      </div>
    </div>
  )
}
