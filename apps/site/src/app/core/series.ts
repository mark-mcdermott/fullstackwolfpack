// Pure time-series bucketing for the dashboard/progress/stats charts. No DB,
// no clock — the caller passes `now`, so it's unit-testable. Uses local-day
// boundaries.

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function daysBetween(earlier: number, later: number): number {
  return Math.round((later - earlier) / 86_400_000)
}

export type DatedValue = { at: string | Date; value: number }

// One summed bucket per day for the last `days` days ending at `now`
// (oldest → newest). Events outside the window are ignored.
export function bucketByDay(
  events: DatedValue[],
  days: number,
  now: Date,
): number[] {
  const buckets = new Array<number>(days).fill(0)
  const end = startOfDay(now)
  for (const e of events) {
    const idx = days - 1 - daysBetween(startOfDay(new Date(e.at)), end)
    if (idx >= 0 && idx < days) buckets[idx] += e.value
  }
  return buckets
}

// Running total of a series (for cumulative XP).
export function cumulative(series: number[]): number[] {
  let sum = 0
  return series.map((v) => (sum += v))
}

// Per-day ratio as a 0–100 percentage; 0 on days with no denominator.
export function ratioByDay(
  numerator: number[],
  denominator: number[],
): number[] {
  return numerator.map((n, i) =>
    denominator[i] > 0 ? Math.round((n / denominator[i]) * 100) : 0,
  )
}
