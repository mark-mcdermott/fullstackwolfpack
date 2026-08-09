// The minute ladder behind the launcher's Play/Learn steppers.
//
// The steppers used to do `value ± 5` clamped to [1, 120], which is not a
// reversible pair once the clamp bites: 5 → down → 0 → clamped to 1, but 1 → up
// → 6, and from there the whole ladder is offset by one (6, 11, 16 …). Stepping
// down and back up left you somewhere you had never been.
//
// Moving along a fixed list instead makes up and down exact inverses at every
// rung, and lets the short end be finer than the long end: single minutes up to
// 5 — a one-minute lesson is a real choice, a 97-minute one is not — then fives
// the rest of the way.
export const MIN_MINUTES = 1
export const MAX_MINUTES = 120

// What both intervals open on. Play used to start at 25 against Learn's 5,
// which put a half-hour session in front of anyone who pressed Start without
// touching the steppers.
export const DEFAULT_MINUTES = 5

export const MINUTE_STEPS: readonly number[] = [
  1,
  2,
  3,
  4,
  ...Array.from({ length: MAX_MINUTES / 5 }, (_, i) => (i + 1) * 5),
]

export const clampMinutes = (v: number) =>
  Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(v)))

// Next rung strictly above `value`, so a typed off-ladder number (7) still
// steps somewhere sensible (→ 10) rather than snapping back to itself.
export function stepMinutesUp(value: number): number {
  const v = clampMinutes(value)
  return MINUTE_STEPS.find((step) => step > v) ?? MAX_MINUTES
}

export function stepMinutesDown(value: number): number {
  const v = clampMinutes(value)
  return [...MINUTE_STEPS].reverse().find((step) => step < v) ?? MIN_MINUTES
}
