import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  BUTTON_META,
  dpadDirections,
  type RetroButton,
  touchButtonsForSystem,
} from '@/core/controls'
import type { RomSystem } from '@/core/roms'
import { cn } from '@/lib/utils'

// Pointer capture keeps a press "held" while the finger slides off the control,
// so pointerup still fires on the origin element. Best-effort — jsdom and a few
// browsers don't implement it.
function capturePointer<T extends Element>(e: ReactPointerEvent<T>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    // unsupported — the control still works, just without slide-off tracking.
  }
}

// On-screen gamepad for touch devices: a diagonal-capable D-pad plus the
// system's face / shoulder / system buttons, each driving the emulator through
// `onDown`/`onUp` (Nostalgist `pressDown`/`pressUp`). Multi-touch works because
// every control captures its own pointer, so a direction and a face button can
// be held at once. All controls are `touch-none select-none` so a press never
// scrolls, zooms, or selects the page.

type PadHandlers = {
  onDown: (button: RetroButton) => void
  onUp: (button: RetroButton) => void
}

const DIR_ICON: Record<'up' | 'down' | 'left' | 'right', ComponentType<{ className?: string }>> = {
  up: ChevronUp,
  down: ChevronDown,
  left: ChevronLeft,
  right: ChevronRight,
}

// Fraction of the pad's half-width a touch must pass on an axis to engage that
// direction. Below it on both axes = dead zone; past it on both = a diagonal.
const DPAD_THRESHOLD = 0.3

function DPad({ onDown, onUp }: PadHandlers) {
  const ref = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)
  const held = useRef<Set<RetroButton>>(new Set())
  const [active, setActive] = useState<Set<RetroButton>>(new Set())

  function directionsAt(clientX: number, clientY: number): Set<RetroButton> {
    const el = ref.current
    if (!el) return new Set()
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return new Set()
    const dx = (clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (clientY - (r.top + r.height / 2)) / (r.height / 2)
    return new Set(dpadDirections(dx, dy, DPAD_THRESHOLD))
  }

  function apply(dirs: Set<RetroButton>) {
    let changed = false
    for (const d of held.current) {
      if (!dirs.has(d)) {
        onUp(d)
        held.current.delete(d)
        changed = true
      }
    }
    for (const d of dirs) {
      if (!held.current.has(d)) {
        onDown(d)
        held.current.add(d)
        changed = true
      }
    }
    if (changed) setActive(new Set(held.current))
  }

  // Release anything still held if the pad unmounts mid-press (e.g. a lesson
  // interrupts) so the emulator never gets a stuck direction.
  useEffect(
    () => () => {
      for (const d of held.current) onUp(d)
      held.current.clear()
    },
    [onUp],
  )

  return (
    <div
      ref={ref}
      aria-label="D-pad"
      className="grid size-28 shrink-0 touch-none grid-cols-3 grid-rows-3 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (pointerId.current !== null) return
        e.preventDefault()
        pointerId.current = e.pointerId
        capturePointer(e)
        apply(directionsAt(e.clientX, e.clientY))
      }}
      onPointerMove={(e) => {
        if (e.pointerId !== pointerId.current) return
        apply(directionsAt(e.clientX, e.clientY))
      }}
      onPointerUp={(e) => {
        if (e.pointerId !== pointerId.current) return
        pointerId.current = null
        apply(new Set())
      }}
      onPointerCancel={(e) => {
        if (e.pointerId !== pointerId.current) return
        pointerId.current = null
        apply(new Set())
      }}
    >
      <span />
      <DpadArm dir="up" active={active.has('up')} />
      <span />
      <DpadArm dir="left" active={active.has('left')} />
      <span className="border border-border bg-muted" />
      <DpadArm dir="right" active={active.has('right')} />
      <span />
      <DpadArm dir="down" active={active.has('down')} />
      <span />
    </div>
  )
}

function DpadArm({
  dir,
  active,
}: {
  dir: 'up' | 'down' | 'left' | 'right'
  active: boolean
}) {
  const Icon = DIR_ICON[dir]
  return (
    <span
      className={cn(
        'flex items-center justify-center border border-border transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

function PadButton({
  button,
  label,
  className,
  onDown,
  onUp,
}: PadHandlers & { button: RetroButton; label: string; className?: string }) {
  const held = useRef(false)

  function down() {
    if (!held.current) {
      held.current = true
      onDown(button)
    }
  }
  function up() {
    if (held.current) {
      held.current = false
      onUp(button)
    }
  }

  useEffect(
    () => () => {
      if (held.current) onUp(button)
    },
    [button, onUp],
  )

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex touch-none items-center justify-center border border-border bg-muted font-mono font-bold text-foreground select-none active:bg-primary active:text-primary-foreground',
        className,
      )}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault()
        capturePointer(e)
        down()
      }}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {label}
    </button>
  )
}

export function TouchControls({
  system,
  onDown,
  onUp,
}: PadHandlers & { system: RomSystem }) {
  const { face, shoulders } = touchButtonsForSystem(system)
  const handlers = { onDown, onUp }

  return (
    <div className="flex flex-col gap-3 border border-border bg-background/60 p-3 select-none">
      {shoulders.length > 0 && (
        <div className="flex items-center justify-between">
          {shoulders.map((b) => (
            <PadButton
              key={b}
              button={b}
              label={BUTTON_META[b].label}
              className="h-9 w-20 text-xs tracking-widest"
              {...handlers}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <DPad {...handlers} />
        <FaceCluster face={face} {...handlers} />
      </div>

      <div className="flex items-center justify-center gap-4">
        <PadButton
          button="select"
          label="Select"
          className="h-8 w-24 text-[10px] tracking-widest uppercase"
          {...handlers}
        />
        <PadButton
          button="start"
          label="Start"
          className="h-8 w-24 text-[10px] tracking-widest uppercase"
          {...handlers}
        />
      </div>
    </div>
  )
}

// Two face buttons sit in a row; four (SNES/Genesis) in the classic diamond
// (X top · Y left · A right · B bottom).
function FaceCluster({ face, onDown, onUp }: PadHandlers & { face: RetroButton[] }) {
  const handlers = { onDown, onUp }
  const round = 'size-12 rounded-full text-sm'

  if (face.length <= 2) {
    return (
      <div className="flex items-center gap-3">
        {face.map((b) => (
          <PadButton
            key={b}
            button={b}
            label={BUTTON_META[b].label}
            className={round}
            {...handlers}
          />
        ))}
      </div>
    )
  }

  const slot = (b: RetroButton) => (
    <PadButton button={b} label={BUTTON_META[b].label} className={round} {...handlers} />
  )
  return (
    <div className="grid size-32 shrink-0 grid-cols-3 grid-rows-3 place-items-center">
      <span />
      {slot('x')}
      <span />
      {slot('y')}
      <span />
      {slot('a')}
      <span />
      {slot('b')}
      <span />
    </div>
  )
}
