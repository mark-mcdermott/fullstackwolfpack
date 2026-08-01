import { Code, Gamepad2 } from 'lucide-react'
import { Fragment } from 'react'
import { Panel } from '@fw/ui'
import { formatClock } from '@/core/focus-session'
import { useTimer } from '@/hooks/timer-context'
import { cn } from '@/lib/utils'

// The session's play↔learn plan as a horizontal rail, driven live by the timer:
// finished phases are filled, the current one is ringed, and every node is a
// button that jumps straight to that phase. Shared by the mission stage and the
// learn view so the loop's spine is always in view.
export function SessionProgress() {
  const timer = useTimer()
  if (!timer.active || timer.plan.length === 0) return null

  return (
    <Panel brackets={false} className="rounded-2xl p-5">
      <span className="font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        Session progress
      </span>
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-[34rem] items-center">
          {timer.plan.map((step, i) => {
            const done = i < timer.stepIndex
            const active = i === timer.stepIndex
            // Only future phases are navigable (skip ahead). Past/current phases
            // are read-only — you can't replay a finished phase.
            const clickable = i > timer.stepIndex
            const Icon = step.phase === 'learn' ? Code : Gamepad2
            const node = (
              <>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border transition-colors',
                    active
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : done
                        ? 'border-emerald-600/60 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/50 dark:text-emerald-400'
                        : 'border-border text-muted-foreground group-hover:border-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="leading-tight">
                  <div
                    className={cn(
                      'font-mono text-[11px] capitalize',
                      active || done ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.phase}
                  </div>
                  <div
                    className={cn(
                      'font-mono text-[11px] tabular-nums',
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {formatClock(step.seconds)}
                  </div>
                </div>
              </>
            )
            return (
              <Fragment key={i}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => timer.jump(i)}
                    aria-label={`Skip to ${step.phase}`}
                    className="group flex shrink-0 cursor-pointer flex-col items-center gap-1.5 text-center"
                  >
                    {node}
                  </button>
                ) : (
                  <div
                    aria-current={active ? 'step' : undefined}
                    className="flex shrink-0 cursor-default flex-col items-center gap-1.5 text-center"
                  >
                    {node}
                  </div>
                )}
                {i < timer.plan.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 mb-6 h-px flex-1',
                      i < timer.stepIndex
                        ? 'bg-emerald-500/40'
                        : 'bg-border',
                    )}
                  />
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
