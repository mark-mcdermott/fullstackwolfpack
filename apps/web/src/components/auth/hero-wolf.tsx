import { WolfSun } from '@fw/ui'

// FW-01 hero visual: the wolf illustration with a HUD dot grid + optional model
// tag. Ported from apps/site HeroWolf.astro.
export function HeroWolf({ fm }: { fm?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-md md:mx-0 md:max-w-none">
      <div className="absolute top-2 right-0 z-10 hidden items-start gap-3 lg:flex">
        <span className="mt-1 font-mono text-sm text-foreground/40">+</span>
        <div className="grid grid-cols-5 gap-x-3 gap-y-2.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-foreground/30" />
          ))}
        </div>
      </div>
      <WolfSun variant="sun" className="w-full" />
      {fm && (
        <span className="absolute right-1 -bottom-1 font-mono text-[11px] tracking-widest text-muted-foreground">
          {fm}
        </span>
      )}
    </div>
  )
}
