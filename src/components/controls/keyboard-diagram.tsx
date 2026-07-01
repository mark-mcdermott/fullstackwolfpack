import {
  type KeyboardBinds,
  type RetroButton,
  RETROPAD_BUTTONS,
} from '@/core/controls'
import { cn } from '@/lib/utils'

// Short glyph shown on a highlighted keycap so you can see, at a glance, which
// console button a physical key drives.
const SHORT: Record<RetroButton, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  b: 'B',
  a: 'A',
  y: 'Y',
  x: 'X',
  l: 'L',
  r: 'R',
  select: 'SEL',
  start: 'ST',
}

type Cap = { retro: string; label: string; className?: string }

const ROWS: Cap[][] = [
  '1 2 3 4 5 6 7 8 9 0'.split(' ').map((c) => ({ retro: c, label: c })),
  'q w e r t y u i o p'.split(' ').map((c) => ({ retro: c, label: c.toUpperCase() })),
  'a s d f g h j k l'.split(' ').map((c) => ({ retro: c, label: c.toUpperCase() })),
  'z x c v b n m'.split(' ').map((c) => ({ retro: c, label: c.toUpperCase() })),
]

const MODIFIERS: Cap[] = [
  { retro: 'lshift', label: 'L-Shift', className: 'w-16' },
  { retro: 'space', label: 'Space', className: 'w-28' },
  { retro: 'rshift', label: 'R-Shift', className: 'w-16' },
  { retro: 'enter', label: 'Enter', className: 'w-16' },
]

const ARROWS: Cap[] = [
  { retro: 'left', label: '←' },
  { retro: 'down', label: '↓' },
  { retro: 'up', label: '↑' },
  { retro: 'right', label: '→' },
]

function Cap({ cap, bound }: { cap: Cap; bound?: RetroButton }) {
  return (
    <span
      className={cn(
        'relative flex h-9 min-w-9 items-center justify-center rounded border px-1 font-mono text-[10px]',
        bound
          ? 'border-primary bg-primary/15 text-foreground'
          : 'border-border text-muted-foreground',
        cap.className,
      )}
    >
      {cap.label}
      {bound && (
        <span className="absolute -top-1.5 -right-1.5 rounded bg-primary px-1 text-[8px] font-bold text-primary-foreground">
          {SHORT[bound]}
        </span>
      )}
    </span>
  )
}

export function KeyboardDiagram({ binds }: { binds: KeyboardBinds }) {
  const boundFor: Record<string, RetroButton> = {}
  for (const button of RETROPAD_BUTTONS) boundFor[binds[button]] = button

  const row = (caps: Cap[], key: string) => (
    <div key={key} className="flex flex-wrap justify-center gap-1">
      {caps.map((cap) => (
        <Cap key={cap.retro} cap={cap} bound={boundFor[cap.retro]} />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background/40 p-4">
      {ROWS.map((caps, i) => row(caps, `r${i}`))}
      {row(MODIFIERS, 'mod')}
      <div className="mt-1 flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Arrows
        </span>
        {row(ARROWS, 'arrows')}
      </div>
    </div>
  )
}
