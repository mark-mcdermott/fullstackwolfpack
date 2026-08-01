import { ArrowRight, Pause } from 'lucide-react'
import { missionName, type MissionSession } from '@/lib/mission'

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
          <span className="my-2 block font-mono text-[10px] leading-none font-medium tracking-widest text-primary uppercase">
            Mission paused
          </span>
          <div className="font-heading text-lg font-bold tracking-wide text-foreground uppercase">
            {missionName(session)}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Pick up where you left off
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
            className="inline-flex h-11 items-center rounded-lg border border-border px-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground"
          >
            End
          </button>
        </div>
      </div>
    </div>
  )
}
