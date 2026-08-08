import { Monitor, Moon, Sun, SunMoon, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Tooltip } from './ui-kit'
import { cn } from './utils'

// What the user picked, which is not the same as which theme is showing:
// `system` resolves against the OS and can change under us while it is selected.
export type ThemeChoice = 'light' | 'dark' | 'system'

// Lucide rather than emoji: the emoji were the one place in the kit that
// rendered as full-colour vendor art, so they ignored `currentColor` and could
// not go red on selection, and their glyph widths disagreed enough that the
// three labels never lined up. These inherit colour and all measure the same.
const OPTIONS: { value: ThemeChoice; icon: LucideIcon; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// Anything unrecognised — an empty store, or the bare 'light'/'dark' this key
// used to hold — falls through to `system`, which is also the default.
function storedChoice(): ThemeChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return 'system'
}

function applyChoice(choice: ThemeChoice) {
  const dark =
    choice === 'dark' ||
    (choice === 'system' && window.matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle('dark', dark)
}

// The theme control: a static sun-and-moon button that opens a three-way menu.
//
// This is the component the light/dark rule carves out an exception for, and it
// needs *less* of one than it used to — the icon no longer swaps with the theme,
// so nothing here renders differently per theme. What it branches on is the
// user's *choice*, which has three states and cannot be expressed in CSS at all.
//
// The menu is hand-rolled rather than pulled from a primitive library: @fw/ui
// carries clsx and tailwind-merge and nothing else, and three static options do
// not justify a dependency. What that costs is the keyboard and dismiss
// behaviour a real menu gives for free, so it is all written out below.
export function ThemeToggle({
  className,
  side = 'bottom',
}: {
  className?: string
  // Which way the menu and the tooltip open. Both follow the one prop because
  // both are anchored to the same button: in the sidebar the control is pinned
  // to the bottom edge by `mt-auto`, so downward is off the end of the panel.
  side?: 'top' | 'bottom'
}) {
  const [choice, setChoice] = useState<ThemeChoice>('system')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([])
  // The inline boot script has already applied the stored choice by the time we
  // mount, so the first pass must not re-apply it — that would flash `system`
  // over a saved `light` whenever the OS is dark.
  const mounted = useRef(false)

  useEffect(() => setChoice(storedChoice()), [])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    applyChoice(choice)
    try {
      localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [choice])

  // Only while `system` is selected: follow the OS if it flips under us.
  useEffect(() => {
    if (choice !== 'system') return
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => applyChoice('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [choice])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) itemsRef.current[Math.max(0, OPTIONS.findIndex((o) => o.value === choice))]?.focus()
  }, [open, choice])

  function onItemKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const next =
      (index + (event.key === 'ArrowDown' ? 1 : OPTIONS.length - 1)) % OPTIONS.length
    itemsRef.current[next]?.focus()
  }

  const current = OPTIONS.find((o) => o.value === choice) ?? OPTIONS[2]

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/* Suppressed while the menu is open: the menu is a descendant of this
          root, so hovering an item still counts as hovering the trigger and the
          tooltip would sit over the list it is describing. */}
      {/* End-aligned for the same reason the menu below is `right-0`: this
          control is the last thing in the bars that host it, so a centred bubble
          hangs off the viewport. */}
      <Tooltip label={`${current.label} mode`} side={side} align="end" disabled={open}>
        <button
          ref={buttonRef}
          type="button"
          data-theme-trigger=""
          onClick={() => setOpen((o) => !o)}
          // Carries the mode as well as the control's name, because the visual
          // tooltip is `aria-hidden` — this is where that text reaches a screen
          // reader. `aria-label` overrides the icon entirely, so nothing is lost
          // by the glyph itself staying constant.
          aria-label={`Theme: ${current.label.toLowerCase()} mode`}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            'inline-flex items-center justify-center p-2 transition-colors',
            open ? 'text-primary' : 'text-muted-foreground hover:text-primary',
          )}
        >
          <SunMoon className="size-4" />
        </button>
      </Tooltip>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className={cn(
            'absolute right-0 z-50 w-44 p-1',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            // Square, ruled and cast-shadowed: the kit's panels have hard edges,
            // and the old `rounded-md` + soft `shadow-lg` was the generic popover
            // look rather than this one.
            'border border-border bg-card text-foreground',
            'light:shadow-[4px_4px_0_rgb(0_0_0/0.07)]',
            // Dark takes the glass treatment instead of the cast shadow: the
            // card colour thinned out over a blur, a hairline of lit edge along
            // the top (the `::before`, which light never renders), and depth
            // from a wide soft drop rather than a hard offset one.
            'dark:border-white/12 dark:bg-card/75 dark:shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] dark:backdrop-blur-xl',
            'dark:before:pointer-events-none dark:before:absolute dark:before:inset-x-0 dark:before:top-0 dark:before:h-px',
            'dark:before:bg-gradient-to-r dark:before:from-transparent dark:before:via-white/25 dark:before:to-transparent',
          )}
        >
          <p className="px-2 pt-1.5 pb-2 font-mono text-[9px] tracking-[0.2em] text-primary uppercase">
            // Theme
          </p>
          {OPTIONS.map(({ value, icon: Icon, label }, index) => (
            <button
              key={value}
              ref={(el) => {
                itemsRef.current[index] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={choice === value}
              onClick={() => {
                setChoice(value)
                setOpen(false)
                buttonRef.current?.focus()
              }}
              onKeyDown={(event) => onItemKeyDown(event, index)}
              className={cn(
                'flex w-full items-center gap-2.5 px-2 py-2 text-left transition-colors',
                'font-mono text-[11px] tracking-[0.14em] uppercase',
                'hover:bg-foreground/[0.05] hover:text-foreground dark:hover:bg-white/[0.07]',
                'focus-visible:bg-foreground/[0.07] focus-visible:outline-none dark:focus-visible:bg-white/[0.09]',
                choice === value ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
              {/* The selected marker. A filled square rather than a tick: it is
                  the kit's own status glyph (the sidebar's "online" dot, the
                  stat tiles), and it reads at 6px where a tick would not. */}
              {choice === value && <span className="ml-auto size-1.5 bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
