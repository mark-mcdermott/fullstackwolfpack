import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

// Bordered "why" strip: a red eyebrow over four icon/title/body columns.
// Ported from apps/site WhyBox.astro.
export type WhyItem = { icon: LucideIcon; title: string; body: string }

const triTopLeft: CSSProperties = {
  borderWidth: '14px 14px 0 0',
  borderStyle: 'solid',
  borderColor: 'var(--foreground) transparent transparent transparent',
}
const triBottomRight: CSSProperties = {
  borderWidth: '0 0 14px 14px',
  borderStyle: 'solid',
  borderColor: 'transparent transparent var(--foreground) transparent',
}

export function WhyBox({
  eyebrow,
  items,
}: {
  eyebrow: string
  items: WhyItem[]
}) {
  return (
    <div className="relative border border-neutral-600 px-6 py-8 md:px-10">
      <span
        className="pointer-events-none absolute top-0 left-0 h-0 w-0"
        style={triTopLeft}
      />
      <span
        className="pointer-events-none absolute right-0 bottom-0 h-0 w-0"
        style={triBottomRight}
      />
      <p className="font-mono text-[11px] tracking-widest text-primary uppercase">
        // {eyebrow}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-0 md:divide-x md:divide-neutral-300">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="relative isolate md:px-6 md:first:pl-0 md:last:pr-0"
          >
            <span
              className="fw-diaglines pointer-events-none absolute inset-2 -z-10 text-foreground opacity-[0.015]"
              aria-hidden
            />
            <Icon className="h-8 w-8 text-foreground" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-3 font-heading text-sm font-semibold tracking-normal text-foreground uppercase">
              {title}
            </h3>
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
