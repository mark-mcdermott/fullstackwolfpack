import { describe, expect, it } from 'vitest'
import { bucketByDay, cumulative, ratioByDay } from './series'

const now = new Date('2025-05-20T12:00:00')
const daysAgo = (n: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 9).toISOString()

describe('bucketByDay', () => {
  it('sums values into the right day, oldest → newest', () => {
    const out = bucketByDay(
      [
        { at: daysAgo(0), value: 5 },
        { at: daysAgo(0), value: 3 },
        { at: daysAgo(2), value: 10 },
      ],
      3,
      now,
    )
    expect(out).toEqual([10, 0, 8]) // [2 days ago, yesterday, today]
  })

  it('ignores events outside the window', () => {
    expect(bucketByDay([{ at: daysAgo(9), value: 7 }], 3, now)).toEqual([0, 0, 0])
  })
})

describe('cumulative', () => {
  it('produces a running total', () => {
    expect(cumulative([1, 0, 2, 3])).toEqual([1, 1, 3, 6])
  })
})

describe('ratioByDay', () => {
  it('is a 0–100 percentage, 0 when no denominator', () => {
    expect(ratioByDay([1, 3, 0], [2, 4, 0])).toEqual([50, 75, 0])
  })
})
