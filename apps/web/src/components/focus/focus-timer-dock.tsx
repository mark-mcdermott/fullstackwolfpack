import { X } from 'lucide-react'
import { useLocation } from 'react-router'
import { useTimer } from '@/hooks/timer-context'

// A small "session complete" summary shown after a focus session ends. The live
// timer + controls now live inline in the game / lesson header
// (SessionTimerInline), so there's no floating box during an active session.
export function FocusTimerDock() {
  const timer = useTimer()
  const location = useLocation()

  if (location.pathname === '/app/sessions') return null
  if (timer.active || !timer.result) return null

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
        {timer.result.playMinutes}m played · {timer.result.learnMinutes}m learned
        {timer.earnedXp !== null && (
          <span className="text-primary"> · +{timer.earnedXp} XP</span>
        )}
      </p>
    </div>
  )
}
