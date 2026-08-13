import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './utils'

// FW-01 design kit — the corner-bracket panels, section labels, stat tiles and
// meters that give every screen the same "tactical HUD" look as the mocks.

// The FW-01 raised CTA — a moulded slab rather than a flat fill: a sheen down
// the face, a 1px darkened-primary border, and inside it a 1px rule that is
// white across the top and left, a lightened primary down the right, and absent
// along the bottom. Sits on a soft cast shadow and presses in on :active.
//
// Every colour is mixed from `--primary`, so the button follows the theme
// instead of hard-coding a red; the face and edge live in theme.css as
// `--cta-face` / `--cta-edge`. Exported as a class as well as a component:
// CTAs are as often anchors or router <Link>s as they are <button>s, and a
// shared class dresses any of them without a polymorphic wrapper.
// A surface that floats above the page — a menu, a term popover, anything that
// opens over content and has to read as being *in front of* it.
//
// Extracted because the two themes need opposite mechanisms here, and the
// reasoning is easy to lose. Light separates with a cast shadow: every surface
// in this theme is white (`--background`, `--card` and `--popover` are all
// oklch(1 0 0)), so fill cannot carry elevation and the shadow has to. A wide
// soft drop over a tight contact layer, rather than a hard offset, which reads
// as a sticker on a page this light.
//
// Dark cannot borrow that. A drop shadow separates by darkening a backdrop
// lighter than the shadow, and there is nothing left to darken — a plate at
// #101114 measured 1.05:1 against the header. So dark separates with *light*:
// the plate steps up to a clearly lighter surface than the card behind it, the
// hairline goes to 18% white so the frame reads on its own, a 1px white ring
// sits outside it, and a sheen runs along the top edge. The black drops stay,
// since these surfaces often overhang lighter art.
//
// Deliberately carries no radius, padding or text colour — callers own those.
// Text colour especially: a popover anchored inside body copy inherits that
// copy's colour, and forcing `text-foreground` here quietly brightened every
// uncoloured child (inline code chips most visibly), which reads as heavier
// type rather than as elevation.
export const popoverSurfaceClass = cn(
  'border border-border bg-card',
  'light:shadow-[0_20px_50px_rgb(0_0_0/0.18),0_4px_12px_rgb(0_0_0/0.08)]',
  'dark:border-white/[0.18] dark:bg-[#22262f]',
  'dark:shadow-[0_18px_40px_rgb(0_0_0/0.55),0_2px_8px_rgb(0_0_0/0.35),0_0_0_1px_rgb(255_255_255/0.08)]',
  'dark:before:pointer-events-none dark:before:absolute dark:before:inset-x-0 dark:before:top-0 dark:before:h-px',
  'dark:before:bg-gradient-to-r dark:before:from-transparent dark:before:via-white/25 dark:before:to-transparent',
)

export const raisedCtaClass = cn(
  // Teko's metrics are rebalanced at the @font-face (theme.css), so its
  // capitals centre in the *box* on their own. The padding is uneven anyway,
  // because the box is not what the eye reads: `--cta-edge` stacks 4px of lit
  // edge on top against a 2px lip below, so the visible face runs 4→54 of the
  // 56px button and its centre sits 1px low. Box-centred text therefore reads
  // high. 17/15 re-centres the caps on the face instead of the box, keeping the
  // same 56px total — retune it if the ring count in `--cta-edge` changes.
  // `relative` positions dark's two pseudo-elements — the smoke and the graded
  // rim, both in theme.css. It draws nothing by itself, and light renders
  // neither pseudo, so the two themes stay one DOM tree.
  'relative inline-flex w-fit items-center justify-center gap-2.5 rounded-lg px-6 pt-[17px] pb-[15px]',
  // 300, a step below the heading font's pinned 400 axis — which needs
  // `font-variation-settings: normal` to escape, or the pin swallows it. No new
  // file: Teko is variable and already carries 300–700 in the one download.
  // Line-height rides on the size utility: a bare `leading-none` did not take,
  // leaving a 1.5 line box that made the button 63px tall.
  'font-heading text-[24px]/[24px] font-light tracking-wide text-white uppercase [font-variation-settings:normal]',
  // Dark sets its CTAs in the mono the launcher's field labels use ("Game
  // mode"), at 14px and kept at light's 300. Geist Mono's caps are 0.755em, so
  // that lands a 10.6px cap — the mock's is 10px, and it is the size the art
  // is actually drawn at rather than a round multiple of the label's. Size
  // only: the line-height stays on the unprefixed utility above, so both
  // button heights are unchanged and the join row keeps its own 20px box.
  // Measuring the mock settles what looks like an oversight — all three of its
  // buttons carry the same cap height, so the join row takes this size too
  // rather than a proportionally smaller one.
  'dark:font-mono dark:text-[14px] dark:tracking-wider',
  // And the 17/15 lean above goes with the bevel it was compensating for.
  // Dark's rim is an even 1.5px, so its face centre *is* the box centre and
  // the lean reads as a droop; 16/16 keeps the same 56px total. Note for any
  // CTA that retunes the padding: this outranks an unprefixed pair, so such a
  // button has to restate its own `dark:` padding or it grows in dark only.
  'dark:pt-4 dark:pb-4',
  // No `border`: the outermost ring is the first inset in `--cta-edge`, so a
  // border would sit outside it and read as a sixth edge.
  'bg-[image:var(--cta-face)]',
  'shadow-[var(--cta-edge)]',
  // Hover amount is per-variant, not global. 1.06 is right in light, where the
  // face is already bright red — but dark's faces are burnt down to near-black
  // (ember bottoms out at #1c0003), and 6% of nearly nothing is nothing. Each
  // `.cta-*` sets its own `--cta-hover` under `.dark`; the filter also lifts the
  // box-shadow, so the edge glow comes up with the face.
  'transition-[filter,box-shadow,translate] hover:brightness-[var(--cta-hover,1.06)]',
  // Light takes its hover from lift rather than brightness — a saturated red
  // has nowhere to go on a filter, but a raised object can still come toward
  // you. Dark keeps brightness alone: its faces are dark enough that a filter
  // reads clearly, and lifting a button that already sits in a glow reads as
  // the glow moving rather than the button.
  // `:hover:not(:active)` rather than plain `:hover`, or the lift and the press
  // tie on specificity and the button stops depressing — you are always hovering
  // at the moment you click, so the press feedback simply disappears.
  'light:[&:hover:not(:active)]:-translate-y-px',
  'light:[&:hover:not(:active)]:shadow-[var(--cta-edge),0_7px_16px_-5px_rgb(0_0_0/0.32)]',
  'active:translate-y-px active:shadow-[inset_0_2px_3px_rgb(0_0_0/0.3),0_1px_2px_rgb(0_0_0/0.25)]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
)

// The compact step of the raised CTA — the size that belongs in a card footer
// or beside body copy rather than under a hero headline. 40px against the base
// 56px, with the type one step down to match.
//
// The `dark:` padding is not decoration: `raisedCtaClass` ships its own
// `dark:pt-4 dark:pb-4`, and a `dark:` utility outranks an unprefixed pair, so
// a compact button that only restated the light padding would silently grow
// back to 52px in dark. Same 20px total either way, split evenly here because
// dark's rim is even top and bottom where light's bevel sits a pixel low.
// The companion to `raisedCtaClass` — the other half of a button pair.
//
// It exists because there wasn't one. Primaries had a shared class; every
// secondary was hand-rolled `border border-border px-… py-…`, a dozen times
// over in the learn surface alone, and they had drifted into a different design
// system from the button beside them. Measured against Next on the lesson nav,
// Back differed on six axes: 34px vs 40px tall, 0 vs 10px radius, Geist Mono vs
// Teko, 12 vs 20px, and no shared elevation language.
//
// A pair should differ on *emphasis* and agree on *shape*. So this matches the
// compact CTA's box exactly — same height, radius, family and size — and
// differs only in the ways that carry hierarchy: no raised face, no cast
// shadow, a hairline instead of a fill. It presses the same 1px on :active, so
// the two feel like the same physical object at different weights.
export const secondaryCtaClass = cn(
  'relative inline-flex w-fit items-center justify-center gap-2.5 rounded-lg',
  // A pixel less top and bottom than the compact CTA's 11/9. That button has no
  // border — its edge is the first inset of `--cta-edge` — so the hairline here
  // is extra height the padding has to give back, or the pair sits 42 to 40.
  'px-4 pt-[10px] pb-[8px] text-[20px]/[20px]',
  // `font-variation-settings: normal` for the same reason raisedCtaClass needs
  // it: theme.css pins Teko's weight axis at 400, and a `font-light` without
  // the escape is silently ignored.
  'font-heading font-light tracking-wide uppercase [font-variation-settings:normal]',
  'border border-border bg-transparent text-muted-foreground',
  'transition-[color,border-color,background-color,translate]',
  'hover:border-muted-foreground hover:text-foreground light:hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
  'active:translate-y-px',
  'disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground',
)

export const raisedCtaCompactClass = cn(
  'px-4 pt-[11px] pb-[9px] text-[20px]/[20px]',
  'dark:pt-[10.5px] dark:pb-[9.5px]',
)

// Card elevation. Light lifts the surface off the page the way the home
// header and Akela's tile do; dark can't reuse that shadow — a black haze on a
// near-black page is invisible — so it goes deeper and tighter, reading as
// depth under a glassy surface rather than a cast shadow.
//
// Carried as a token (`--panel-lift`, declared in the index.css/theme.css
// pair) rather than two arbitrary values, so the two themes stay one DOM tree
// and the lift can be retuned in one place.
export const cardLiftClass = 'shadow-[var(--panel-lift)]'

export function RaisedButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button type="button" className={cn(raisedCtaClass, className)} {...props} />
  )
}

function Brackets() {
  const base = 'pointer-events-none absolute size-2.5 border-foreground'
  return (
    <>
      <span className={cn(base, 'top-0 left-0 border-t-2 border-l-2')} />
      <span className={cn(base, 'top-0 right-0 border-t-2 border-r-2')} />
      <span className={cn(base, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(base, 'right-0 bottom-0 border-r-2 border-b-2')} />
    </>
  )
}

// Makes a dark card read as machined rather than as a floating rectangle.
//
// Two effects, both dark-only, and both deliberately *not* box-shadows: a
// caller that sets its own shadow (cardLiftClass, say) would silently remove
// them, and the whole point is that they are the surface rather than decoration
// on top of it.
//
// - a hairline of light along the top edge, where a milled face catches the
//   room light, drawn as a pseudo-element so nothing can override it
// - a face fractionally brighter at the top than the bottom, as a background
//   *image* layered over `bg-card`'s colour
//
// Nothing here should be consciously visible. Together they are the difference
// between a panel that sits on the page and one that feels cut from it.
export const cardSurfaceClass = cn(
  'dark:bg-[linear-gradient(to_bottom,rgb(255_255_255/0.032)_0%,rgb(255_255_255/0)_44%)]',
  'dark:before:pointer-events-none dark:before:absolute dark:before:inset-x-0 dark:before:top-0 dark:before:z-[1] dark:before:h-px',
  'dark:before:bg-gradient-to-r dark:before:from-transparent dark:before:via-white/[0.075] dark:before:to-transparent',
)

export function Panel({
  className,
  children,
  brackets = true,
  ...props
}: ComponentProps<'div'> & { brackets?: boolean }) {
  return (
    <div
      className={cn(
        'relative border border-border bg-card p-5',
        cardSurfaceClass,
        className,
      )}
      {...props}
    >
      {brackets && <Brackets />}
      {children}
    </div>
  )
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'font-mono text-xs font-medium tracking-widest text-primary uppercase',
        className,
      )}
    >
      // {children}
    </p>
  )
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

// A hover/focus label for an icon-only control — the readout FW-01 would print
// next to a switch, not a rounded chat bubble: mono, uppercase, wide-tracked,
// square, with a small pointer back to the trigger.
//
// CSS-only by construction. There is no open state and no timer, so it costs
// nothing to hydrate and works the same inside an Astro island as in the app;
// `group-hover` and `group-focus-visible` mean a keyboard tab reveals it too.
// It stays `pointer-events-none` so it can never eat a click meant for the
// trigger underneath, and `aria-hidden` because the trigger's own `aria-label`
// already carries the text — announcing both just says it twice.
// `align` is for triggers that sit hard against the right edge of their bar. A
// centred bubble hangs half its width past the trigger, which off the last
// control in a row is half a bubble past the viewport — real horizontal
// overflow, and it counts even while the tooltip is invisible, because it is
// hidden with opacity rather than `display`. `align="end"` pins its right edge
// to the trigger's instead, the same thing ThemeToggle's menu does with
// `right-0`. The pointer stays centred on the trigger either way — it points at
// the control, not at the bubble.
export function Tooltip({
  label,
  side = 'bottom',
  align = 'center',
  disabled = false,
  children,
  className,
}: {
  label: string
  side?: 'top' | 'bottom'
  align?: 'center' | 'end'
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  // The fill is shared by the bubble and its pointer so the two read as one
  // shape: flat and high-contrast in light, tinted glass in dark. The tint is
  // heavy (95%) because the pointer is tucked *behind* the bubble and the
  // overlap has to actually be covered — at the 80% a lighter glass wants, the
  // pointer's far edges showed straight through and it read as a floating
  // diamond rather than as part of the bubble.
  const fill = 'bg-foreground dark:bg-card/95 dark:backdrop-blur-xl'
  const isBottom = side === 'bottom'
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      {!disabled && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute z-50 px-2.5 py-1.5 whitespace-nowrap',
              align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2',
              'font-mono text-[10px] leading-none tracking-[0.18em] uppercase',
              'text-background dark:text-foreground',
              fill,
              'light:shadow-[3px_3px_0_rgb(0_0_0/0.10)]',
              'dark:ring-1 dark:ring-inset dark:ring-white/15',
              // Held a few pixels toward the trigger and eased out to rest —
              // the same small settle as the reference, without the loop.
              'opacity-0 transition-[opacity,translate] duration-200 ease-out',
              'group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100',
              'group-hover/tip:translate-y-0 group-focus-visible/tip:translate-y-0',
              isBottom ? 'top-full mt-2.5 translate-y-1' : 'bottom-full mb-2.5 -translate-y-1',
            )}
          >
            {label}
          </span>
          {/* The pointer: a square turned 45°, overlapping the bubble so only
              the two outward edges show. Those two get a border and the other
              two do not — a ring draws all four, which in dark outlined the
              whole diamond and detached it from the bubble. Which pair is
              outward flips with the side. No cast shadow either: offset by the
              bubble's 3px it would trail a second diamond.

              It paints *above* the bubble (z-51 vs z-50), which is what keeps
              the two reading as one shape in dark. The bubble's outline is an
              inset ring, so it draws on all four inner edges — including the
              one the pointer meets. Underneath the bubble, that line ran
              straight across the diamond's base and the pointer read as a
              separate tab stuck to a bordered box. On top, the pointer's fill
              hides that segment and its own two borders carry the outline
              around the point. Light never showed the seam because its bubble
              has no ring at all — only a shadow — which is why this looked like
              a dark-only bug rather than a z-order one. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-1/2 z-[51] size-2 -translate-x-1/2 rotate-45',
              fill,
              'border-foreground dark:border-white/15',
              'opacity-0 transition-opacity duration-200 ease-out',
              'group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100',
              isBottom ? 'top-full mt-1.5 border-t border-l' : 'bottom-full mb-1.5 border-r border-b',
            )}
          />
        </>
      )}
    </span>
  )
}

export function StatTile({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: LucideIcon
  value: ReactNode
  label: string
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Icon className="size-5 text-primary" />
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="font-mono text-xs tracking-wide uppercase">{label}</span>
      {sub && (
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          {sub}
        </span>
      )}
    </div>
  )
}

export function ProgressMeter({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-1.5 w-full bg-muted', className)}>
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageHeading({
  label,
  title,
  subtitle,
}: {
  label: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6">
      <SectionLabel>{label}</SectionLabel>
      <h1 className="mt-2 text-4xl font-bold tracking-tight uppercase">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-xl font-mono text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}

// The brand wolf mark (branding/logo-small.svg), inlined with fill=currentColor
// so it recolors with the surrounding text and renders reliably at any size —
// crisp on light or dark. Callers set the height; width follows the viewBox.
export function WolfMark({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Fullstack Wolfpack"
      viewBox="0 0 139 162"
      fill="currentColor"
      className={cn('inline-block', className)}
    >
      <path d="M25.27,54.18l6.84-4.14c-1.23,3.45-3.8,4.65-6.84,4.14Z" />
      <path d="M107.18,43.97l-1.21,7.36c-2.19-3.55-5.22-6.55-8.29-7.82.84-3.29,1.19-7.6,2.27-10.99,1.52-4.8,5.28-9.51,7.88-13.12-4.95,8.1-5.32,18.3-5.63,18.3l3.64.02-2.29,4.13,3.64,2.12Z" />
      <rect x="109.73" y="49.94" width="1.71" height="5.83" transform="translate(8.37 120.49) rotate(-59.04)" />
      <rect x="116.15" y="50.15" width=".71" height=".71" transform="translate(-1.59 97.17) rotate(-45)" />
      <path d="M57.8,101.7c-.38-1.21-.95-3.97-1.49-5.06-2.01-2.95-7.88-4.99-11.8-3.98l-6.13-8.32c-.56-.76-2.04-1.97-3.3-3.43l16.02,4.12,5.12,8.91c1.15,2.01,1.76,5.55,1.58,7.75Z" />
      <path d="M33.4,108l-.04-1.07,1.16,1.09.48.49.62.67c6.52,6.99,9.77,8.3,10.16,21.77-1.02-3.5-1.93-7.48-3.82-10.55l-6.59-10.71-.85-.72-.54-.46-.6-.51Z" />
      <path d="M93.23,130.02l.33-9.39,12.16-14.71-7.68,12.34c-2.2,3.54-3.45,7.14-4.82,11.75Z" />
      <rect x="69" y="97" width="1" height="21.5" />
      <rect x="69" y="41" width="1" height="17" />
      <path d="M82.77,93.43c5.65-10.45,6.01-9.33,21.22-12.47-3.19,3.09-5.41,5.51-8.3,8.97l1.09,1.3-.56.51-.81-.87-3.24.89c-4.38,1.21-7.64,2.74-10.78,5.63l.37-3.18-.5-1.87c-.8-2.55-1.81-6.52-2.08-9.24l2.46,9.29,1.13,1.03Z" />
      <polygon points="57.15 93.01 60.34 83.93 61.17 84.57 59.04 92.6 57.15 93.01" />
      <polygon points="69.18 67.05 68.94 59.45 70.28 59 70.03 66.51 69.18 67.05" />
      <polygon points="69.35 88.14 68.91 83.5 69.74 82.95 70.08 86.52 69.35 88.14" />
      <path d="M81.35,99.75c.24,2.59.26,2.77.04.43-.11-1.1-.14-1.49-.04-.43Z" />
      <polygon points="56.25 77.76 56.75 77.26 57.5 78 58.01 78.49 58.51 78.99 59.02 79.47 59.67 80.07 59.56 81.63 58.47 79.99 58.02 79.5 57.51 78.99 57 78.5 56.25 77.76" />
      <polygon points="69.5 92.01 69.52 92.66 69.52 93.34 69.5 93.99 69.48 93.34 69.48 92.66 69.5 92.01" />
      <polygon points="78.98 81.57 83.49 77 83.98 77.5 79.99 81.56 78.98 81.57" />
      <path d="M116.28,0h.45l6.34,34.98c.3,1.61,1.17,3.29,1.07,4.89l-1.38,20.91,9.45,6.98-6,1.8,9.76,17.61,3.04,4.09v1.73s-5.43-.33-5.43-.33l-3.13-1.33,6.34,15.7c.39.96,1.61,2.79,2.23,3.11v.72c-5.48-1.13-14.6.31-17.85,6.29-2.46,4.53-2,11.58-2.44,16.47l-7.18-10.19-28.14,31.97c-1.71,1.94-3.4,4.59-4.74,6.59h-18.64s-2.16-3.72-2.16-3.72l-22.12-24.94-8.43-9.17-7.15,9.53c-.84-7.14-.46-14.41-4.93-18.45C10.68,111.16,4.85,109.44,0,110.69v-1.69c.65-.2,1.85-1.97,2.26-2.91l6.32-14.62L0,91.66v-1.66c.81-.29,2.36-2.1,2.87-3.06l9.35-17.48-5.4-1.69,9.16-6.96c.46-8.24-1.99-16.87-.57-24.08L22.28,0h.43l29.46,33.85c2.89-.21,5.03-.29,7.78-.3l25.33-.14c-9.52,4.55-19.92,3.4-30.41.52-3.07,1.91-5.74,4.79-9.15,8.42.34-4.41-1.51-9.23-3.96-12.4l-.73.78,1.72,12.39-7.28,4.13c-.25.14-.75,1.83-.86,2.09-.11.28-.46.3-.59.06l-.8-1.43c-.45-.79-1.46-3.36-.72-3.88l3.71-2.65-3.96-3.05c.68.12,3.51.49,3.47-.27l-.16-2.91,1.21-1.12-4.5-12.61c1.31,1.37,2.24,2.37,4.44,3.87-3.41-8.27-7.21-13.8-13.28-20.88l-4.66,31.85,4.24,14.47-4.31-6.9,1.18,12.49,3.71.27-7.1,6.89c-.39.38-1.81,1.61-1.45,1.98l1.77,1.81-8.62,17.18,6.92-2.29-6.71,5.94,4.2.17-8.47,19.47c5.38-1.38,7.27,3.32,14.25,4.12l4.36,13.32,4.69-6.39c6.07,6.34,11.44,12.44,17.88,19.91l.81-6.88c.75,2.99.31,9.16,2.15,11.47l7.86,9.85c5.07-.58,9.27-1.8,13.33-4.92l-4.75-4.73c-4.38-.61-5.94-3.56-6.21-7.64l-1.21-17.82c-.34-4.99-.38-9.64.36-14.16l2.43,28.88c6.6-1.13,12.89-1,19.72.01l.55-14.89c.1-2.64.67-5.58,1.34-8.06.31,5.99,1.01,11.39.23,16.88l-1.44,10.2c-.87,6.17-4.89,4.24-10.72,11.39,4.12,3.01,8.28,4,13.39,4.4l7.91-10.11,1.37-10.54.73,7.67,10.2-12.55c2.39-2.94,5.43-5.8,8.69-8.73l3.27,6.31,4.28-12.49,10.75-3.62-3.48-2.47,7.77,1.8c-3.1-7.47-5.69-13.11-9.28-20.5l1.75.32,1.4-1.44-5.17-3.68-1.13-.92c.06-.05.66-.55.59-.5l.77.89,4.65,2.26,1.01-1.04-6.6-15.25,1.76-2-9.12-9.68,4.59,1.44,1.42-13.46-4.25,4.29c5.58-12.95.71-29.47-1.64-44.5-9.05,13.02-19.45,26.22-20.68,38.97-2.61-3.79-5.03-6.82-8.34-8.68L116.28,0ZM40.2,30.49l.41-1.61-.41,1.61ZM36.84,34.41l-.52,1.81.52-1.81ZM129.87,84.38l-1.11.44,1.11-.44ZM128.06,87.94l.99-1.44-.99,1.44Z" />
      <rect x="16.15" y="81.15" width=".71" height=".71" transform="translate(-52.8 35.54) rotate(-45)" />
      <rect x="69.15" y="38.15" width=".71" height=".71" transform="translate(-6.87 60.42) rotate(-45)" />
    </svg>
  )
}

// Horizontal lockup — wolf mark + name. Used in headers/footers.
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <WolfMark className="h-9" />
      <div className="flex flex-col leading-none">
        <span className="font-mono text-sm font-bold tracking-tight">
          FULLSTACK WOLFPACK
        </span>
        <span className="mt-0.5 font-mono text-xs tracking-widest text-primary">
          ウルフパック
        </span>
      </div>
    </div>
  )
}
