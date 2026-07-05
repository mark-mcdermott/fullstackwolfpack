import type { RetroButton } from '@/core/controls'
import { cn } from '@/lib/utils'

type Props = {
  // Display value per button (a key label, or a pad button index).
  values: Record<RetroButton, string>
  activeButton?: RetroButton | null
  onPick?: (button: RetroButton) => void
}

function Key({
  button,
  glyph,
  values,
  activeButton,
  onPick,
  className,
}: Props & { button: RetroButton; glyph: string; className?: string }) {
  const active = activeButton === button
  const interactive = Boolean(onPick)
  return (
    <button
      type="button"
      onClick={interactive ? () => onPick?.(button) : undefined}
      aria-label={`${button} button`}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-card font-mono leading-none',
        interactive
          ? 'cursor-pointer hover:border-primary hover:bg-muted'
          : 'cursor-default',
        active && 'border-primary ring-1 ring-primary',
        className,
      )}
    >
      <span className="text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
        {glyph}
      </span>
      <span className="text-xs font-bold text-foreground">
        {active ? '…' : values[button]}
      </span>
    </button>
  )
}

const CROSS = 'grid gap-1 [grid-template-columns:repeat(3,3rem)] [grid-template-rows:repeat(3,3rem)]'
const CELL = 'size-full'

export function GamepadDiagram(props: Props) {
  const key = (button: RetroButton, glyph: string) => (
    <Key {...props} button={button} glyph={glyph} className={CELL} />
  )
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-background/40 p-5">
      <div className="flex justify-between">
        <Key {...props} button="l" glyph="L" className="h-9 w-24" />
        <Key {...props} button="r" glyph="R" className="h-9 w-24" />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* D-pad */}
        <div className={CROSS}>
          <span />
          {key('up', '▲')}
          <span />
          {key('left', '◀')}
          <span className="rounded-md border border-border bg-card" />
          {key('right', '▶')}
          <span />
          {key('down', '▼')}
          <span />
        </div>

        {/* Select / Start */}
        <div className="flex flex-col items-center gap-2">
          <Key {...props} button="select" glyph="Select" className="h-7 w-20" />
          <Key {...props} button="start" glyph="Start" className="h-7 w-20" />
        </div>

        {/* Face buttons */}
        <div className={CROSS}>
          <span />
          {key('x', 'X')}
          <span />
          {key('y', 'Y')}
          <span />
          {key('a', 'A')}
          <span />
          {key('b', 'B')}
          <span />
        </div>
      </div>
    </div>
  )
}
