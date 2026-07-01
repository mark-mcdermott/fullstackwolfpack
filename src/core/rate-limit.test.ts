import { describe, expect, it } from 'vitest'
import { decide, nextBucket } from './rate-limit'

const WINDOW = 60_000

describe('nextBucket', () => {
  it('starts a fresh window when there is no prior bucket', () => {
    expect(nextBucket(null, 1000, WINDOW)).toEqual({ count: 1, windowStart: 1000 })
  })

  it('increments within the window', () => {
    expect(nextBucket({ count: 2, windowStart: 1000 }, 1500, WINDOW)).toEqual({
      count: 3,
      windowStart: 1000,
    })
  })

  it('resets once the window has elapsed', () => {
    expect(
      nextBucket({ count: 9, windowStart: 1000 }, 1000 + WINDOW, WINDOW),
    ).toEqual({ count: 1, windowStart: 1000 + WINDOW })
  })
})

describe('decide', () => {
  it('allows while at or under the limit', () => {
    expect(decide({ count: 5, windowStart: 1000 }, 1200, 5, WINDOW).allowed).toBe(
      true,
    )
  })

  it('blocks past the limit and reports retry-after', () => {
    const d = decide({ count: 6, windowStart: 1000 }, 1200, 5, WINDOW)
    expect(d.allowed).toBe(false)
    expect(d.retryAfterMs).toBe(1000 + WINDOW - 1200)
  })

  it('never reports negative remaining', () => {
    expect(decide({ count: 8, windowStart: 1000 }, 1200, 5, WINDOW).remaining).toBe(
      0,
    )
  })
})
