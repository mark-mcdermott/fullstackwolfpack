import { useMemo } from 'react'
import { EMBLEM_PALETTE, GRID, pixelEmblem } from '@/lib/badge-pixel-art'
import { cn } from '@/lib/utils'

export type BadgeState = 'earned' | 'progress' | 'locked'

// Is (x,y) part of the tile? (corners chamfered by 2 for a coin/tile silhouette)
function onPlate(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false
  const c = 2
  return !(
    x + y < c ||
    x + (GRID - 1 - y) < c ||
    GRID - 1 - x + y < c ||
    GRID - 1 - x + (GRID - 1 - y) < c
  )
}

type Cell = { x: number; y: number; fill: string }

function plateCells(state: BadgeState): Cell[] {
  // Beveled tile: lighter top-left edge, darker bottom-right edge.
  const tone =
    state === 'earned'
      ? { base: '#2a2f40', hi: '#3c4462', lo: '#151824' }
      : { base: '#20232e', hi: '#2b2f3c', lo: '#12141c' }
  const cells: Cell[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!onPlate(x, y)) continue
      const topLeft = !onPlate(x - 1, y) || !onPlate(x, y - 1)
      const botRight = !onPlate(x + 1, y) || !onPlate(x, y + 1)
      cells.push({
        x,
        y,
        fill: topLeft ? tone.hi : botRight ? tone.lo : tone.base,
      })
    }
  }
  return cells
}

function emblemCells(slug: string, state: BadgeState): Cell[] {
  const rows = pixelEmblem(slug)
  const cells: Cell[] = []
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch === '.') return
      let fill: string
      if (state === 'locked') {
        // Silhouette: outline stays dark, body is a single muted tone.
        fill = ch === 'K' ? '#2b3040' : '#525a6e'
      } else {
        fill = EMBLEM_PALETTE[ch] ?? '#525a6e'
      }
      cells.push({ x, y, fill })
    })
  })
  return cells
}

export function PixelBadge({
  slug,
  state,
  size = 60,
  className,
}: {
  slug: string
  state: BadgeState
  size?: number
  className?: string
}) {
  const cells = useMemo(
    () => [...plateCells(state), ...emblemCells(slug, state)],
    [slug, state],
  )
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        state === 'earned' &&
          'rounded-sm ring-2 ring-primary/40 shadow-[0_0_14px_-2px] shadow-primary/40',
        state === 'progress' && 'opacity-90 saturate-50',
        state === 'locked' && 'opacity-80',
        className,
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${GRID} ${GRID}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`${slug} badge, ${state}`}
        style={{ imageRendering: 'pixelated' }}
      >
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={1} height={1} fill={c.fill} />
        ))}
      </svg>
    </div>
  )
}
