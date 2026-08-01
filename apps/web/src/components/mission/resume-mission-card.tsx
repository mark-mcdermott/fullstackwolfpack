import { ArrowRight, Pause } from 'lucide-react'
import type { MissionSession } from '@/lib/mission'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Shown on the homepage when a mission is paused ("take a break" / a fresh tab
// that reloaded a paused session): pick it up exactly where you left off, or end
// it. Starting a brand-new mission from the launcher ends this one.
export function ResumeMissionCard({
  session,
  onResume,
  onDiscard,
}: {
  session: MissionSession
  onResume: () => void
  onDiscard: () => void
}) {
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Pause className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] font-medium tracking-widest text-primary uppercase">
            Mission paused
          </span>
          <div className="font-heading text-lg font-bold tracking-wide text-foreground uppercase">
            {session.gameTitle}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {session.skillName} · {cap(session.difficulty)} · pick up where you
            left off
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90"
          >
            Resume mission
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            End
          </button>
        </div>
      </div>
    </div>
  )
}
