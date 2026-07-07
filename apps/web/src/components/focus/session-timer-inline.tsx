import { Pause, Play, SkipForward, Square } from 'lucide-react'
import { formatClock } from '@/core/focus-session'
import { useTimer } from '@/hooks/timer-context'
import { cn } from '@/lib/utils'

// A small, quiet focus timer for the game / lesson header — just the phase, the
// clock counting down, and pause/skip/end. Renders nothing when no session is
// active (casual play is uninterrupted). Replaces the floating dock while you're
// inside the loop.
export function SessionTimerInline({ className }: { className?: string }) {
  const timer = useTimer()
  if (!timer.active || !timer.step) return null

  const isPlay = timer.step.phase === 'play'
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {isPlay ? 'Play' : 'Learn'}
      </span>
      <span className="font-mono tabular-nums">
        {formatClock(timer.secondsLeft)}
      </span>
      {timer.paused && (
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          paused
        </span>
      )}
      <span className="flex items-center gap-0.5">
        <IconButton
          icon={timer.paused ? Play : Pause}
          label={timer.paused ? 'Resume' : 'Pause'}
          onClick={() => (timer.paused ? timer.resume() : timer.pause())}
        />
        <IconButton icon={SkipForward} label="Skip phase" onClick={timer.skip} />
        <IconButton icon={Square} label="End session" onClick={timer.end} />
      </span>
    </div>
  )
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pause
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="size-3.5" />
    </button>
  )
}
