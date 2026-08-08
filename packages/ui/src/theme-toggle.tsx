import { SunMoon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from './utils'

// What the user picked, which is not the same as which theme is showing:
// `system` resolves against the OS and can change under us while it is selected.
export type ThemeChoice = 'light' | 'dark' | 'system'

const OPTIONS: { value: ThemeChoice; emoji: string; label: string }[] = [
  { value: 'light', emoji: '☀️', label: 'Light' },
  { value: 'dark', emoji: '🌙', label: 'Dark' },
  { value: 'system', emoji: '💻', label: 'System' },
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
export function ThemeToggle({ className }: { className?: string }) {
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

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center p-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <SunMoon className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 z-50 mt-1 min-w-36 overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg"
        >
          {OPTIONS.map(({ value, emoji, label }, index) => (
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
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none',
                choice === value && 'font-medium text-foreground',
              )}
            >
              {/* Hidden from assistive tech: the label already says "Light",
                  and the emoji name read aloud in front of it only adds noise.
                  The gap is a flex gap rather than a literal space so it does
                  not depend on the glyph's own advance, which differs per
                  emoji — the laptop sits tighter than the sun. */}
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
