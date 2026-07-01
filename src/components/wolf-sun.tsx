import { WolfMark } from '@/components/ui-kit'
import { cn } from '@/lib/utils'

// The signature hero motif from the mocks: the wolf mark against a red "sun",
// with a couple of FW-01 crosshair flourishes. Parent sets the size.
export function WolfSun({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      aria-hidden="true"
    >
      <div className="absolute top-[6%] right-[12%] aspect-square w-[58%] rounded-full bg-primary" />
      <WolfMark className="relative z-10 h-full text-foreground" />
      <span className="absolute top-2 right-1 font-mono text-lg text-primary">
        +
      </span>
      <span className="absolute bottom-8 left-0 font-mono text-sm text-muted-foreground">
        +
      </span>
      <span className="absolute right-2 bottom-2 font-mono text-[10px] tracking-widest text-muted-foreground">
        35.6895° N
      </span>
    </div>
  )
}
