import { Check, Menu, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router'
import { THEME_OPTIONS, popoverEdgeClass, popoverSurfaceClass, useThemeChoice } from '@fw/ui'
import { cn } from '@/lib/utils'

export type FwMobileMenuItem = {
  to: string
  label: string
  end?: boolean
  badge?: number
}

// Where the bar's own nav takes over. Kept as a query as well as a Tailwind
// prefix because the open state has to be dropped when the viewport crosses it
// — the panel is anchored to a button that is no longer on screen.
const BAR_NAV_QUERY = '(min-width: 40rem)'

// The header's nav below `sm`, where the four labels no longer fit across the
// bar: a hamburger that opens a panel carrying the same routes plus the three
// theme options, so the bar keeps only the brand and this one control.
//
// Open/closed lives in `FwHeader` rather than here because the dimmed page
// behind the panel does: a scrim is `fixed inset-0`, so it has to sit outside
// the bar row to leave the brand and this button lit, and that puts it out of
// this component's subtree.
export function FwMobileMenu({
  items,
  open,
  onOpenChange,
}: {
  items: FwMobileMenuItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [choice, setChoice] = useThemeChoice()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const close = () => onOpenChange(false)
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      close()
      buttonRef.current?.focus()
    }
    const barNav = window.matchMedia(BAR_NAV_QUERY)
    const onBarNav = () => barNav.matches && close()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    barNav.addEventListener('change', onBarNav)
    // The header does not stick, so without this the button and panel scroll
    // away from under the scrim, which does not.
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      barNav.removeEventListener('change', onBarNav)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  return (
    <div ref={rootRef} className="relative sm:hidden">
      {/* Bare glyph closed, a plate open — the button borrows the panel's fill
          and hairline so the two read as one shape with the pointer between
          them, which is what ties the panel to the corner it came from. */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="fw-mobile-menu"
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors',
          open && cn('border', popoverEdgeClass),
        )}
      >
        {open ? <X className="size-5" /> : <Menu className="size-6" />}
      </button>

      {open && (
        <>
          {/* Same construction as the theme menu's pointer: a square turned 45°
              with borders on its two outward edges, painted above the panel so
              the panel's own top edge cannot run across its base. Anchored to
              this root, which wraps the button and nothing else, so `left-1/2`
              aims it at the glyph rather than at the middle of the much wider
              panel. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-full left-1/2 z-[51] mt-[10px] size-3 -translate-x-1/2 rotate-45 border-t border-l',
              popoverEdgeClass,
            )}
          />

          <div
            id="fw-mobile-menu"
            className={cn(
              'absolute top-full right-0 z-50 mt-4 px-3 pt-3 pb-4',
              // Wide enough that the longest label sits well clear of the right
              // edge, and short enough to leave the page showing down the side
              // — this is a panel hanging off the corner, not a drawer.
              //
              // The subtrahend is *twice* the widest inset this panel's right
              // edge can carry (light's bar is a card, so 20px of gutter on top
              // of the bar's own 12px of padding). Deducting the one inset was
              // enough down to ~368px and then hung the left edge off the side
              // of a 320px phone, border and all.
              'w-[min(19rem,calc(100vw-4rem))]',
              popoverSurfaceClass,
            )}
          >
            <nav className="flex flex-col">
              {items.map(({ to, label, end, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => onOpenChange(false)}
                  className="group relative flex h-[50px] items-center pl-5 font-mono text-sm font-bold tracking-wide uppercase"
                >
                  {({ isActive }) => (
                    <>
                      {/* The bar marks the current route with an underline
                          under a horizontal row; stood on its end for a
                          vertical one it becomes this. */}
                      <span
                        className={cn(
                          'absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2',
                          isActive ? 'bg-primary' : 'bg-transparent',
                        )}
                      />
                      <span
                        className={cn(
                          'transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-foreground group-hover:text-primary',
                        )}
                      >
                        {label}
                      </span>
                      {!!badge && (
                        <span
                          aria-label={`${badge} review${badge === 1 ? '' : 's'} due`}
                          className="ml-2.5 inline-flex min-w-[17px] items-center justify-center rounded-full bg-primary px-1 py-px text-[10px]/[13px] font-bold text-primary-foreground tabular-nums"
                        >
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mx-2 my-3 h-px bg-border" />

            {/* The bar's theme control folded in, since it is hidden at this
                width too. A radio group rather than the `menu`/`menuitemradio`
                the toggle uses: that panel is only ever options, this one is a
                disclosure holding links as well. */}
            <div role="radiogroup" aria-label="Theme" className="flex flex-col">
              {THEME_OPTIONS.map(({ value, icon: Icon, label }) => {
                const selected = choice === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    // No close: the theme changes behind the panel, and picking
                    // one is the only thing here you might want to see land
                    // before you leave.
                    onClick={() => setChoice(value)}
                    className={cn(
                      'flex h-10 items-center gap-4 pr-2 pl-4 transition-colors',
                      'font-mono text-xs tracking-[0.18em] uppercase',
                      selected ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                    {selected && <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
