import { describe, expect, it } from 'vitest'
import {
  MAX_MINUTES,
  MINUTE_STEPS,
  MIN_MINUTES,
  clampMinutes,
  stepMinutesDown,
  stepMinutesUp,
} from './session-minutes'

describe('MINUTE_STEPS', () => {
  it('surfaces every single minute up to 5, then fives to the cap', () => {
    expect(MINUTE_STEPS.slice(0, 6)).toEqual([1, 2, 3, 4, 5, 10])
    expect(MINUTE_STEPS.at(-1)).toBe(MAX_MINUTES)
    expect(MINUTE_STEPS.filter((m) => m > 5).every((m) => m % 5 === 0)).toBe(true)
  })

  it('ascends without duplicates', () => {
    expect([...MINUTE_STEPS].sort((a, b) => a - b)).toEqual([...MINUTE_STEPS])
    expect(new Set(MINUTE_STEPS).size).toBe(MINUTE_STEPS.length)
  })
})

describe('stepping', () => {
  it('walks the short end a minute at a time', () => {
    expect(stepMinutesUp(1)).toBe(2)
    expect(stepMinutesUp(4)).toBe(5)
    expect(stepMinutesDown(5)).toBe(4)
    expect(stepMinutesDown(2)).toBe(1)
  })

  it('switches to fives above 5', () => {
    expect(stepMinutesUp(5)).toBe(10)
    expect(stepMinutesUp(25)).toBe(30)
    expect(stepMinutesDown(10)).toBe(5)
  })

  // The bug this replaces: 5 → down → 1 → up → 6, and every rung after was
  // offset by one.
  it('makes up and down exact inverses at every rung', () => {
    for (const step of MINUTE_STEPS.slice(1)) {
      expect(stepMinutesUp(stepMinutesDown(step))).toBe(step)
    }
    for (const step of MINUTE_STEPS.slice(0, -1)) {
      expect(stepMinutesDown(stepMinutesUp(step))).toBe(step)
    }
  })

  it('holds at the ends instead of wrapping or overshooting', () => {
    expect(stepMinutesDown(MIN_MINUTES)).toBe(MIN_MINUTES)
    expect(stepMinutesUp(MAX_MINUTES)).toBe(MAX_MINUTES)
  })

  it('moves a typed off-ladder value to the neighbouring rung', () => {
    expect(stepMinutesUp(7)).toBe(10)
    expect(stepMinutesDown(7)).toBe(5)
  })

  it('clamps out-of-range input before stepping', () => {
    expect(clampMinutes(0)).toBe(MIN_MINUTES)
    expect(clampMinutes(999)).toBe(MAX_MINUTES)
    expect(stepMinutesUp(-40)).toBe(2)
    expect(stepMinutesDown(999)).toBe(115)
  })
})
