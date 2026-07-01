import { cn } from './utils'

// Lightweight SVG/CSS charts — enough to match the mock dashboards without a
// charting dependency.

export function Sparkline({
  data,
  className,
}: {
  data: number[]
  className?: string
}) {
  const max = Math.max(...data, 1)
  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? 0 : (i / (data.length - 1)) * 100
      return `${x},${100 - (v / max) * 100}`
    })
    .join(' ')
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('h-full w-full text-primary', className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function Bars({
  data,
  className,
}: {
  data: number[]
  className?: string
}) {
  const max = Math.max(...data, 1)
  return (
    <div className={cn('flex h-full items-end gap-1', className)} aria-hidden="true">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-primary"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  )
}
