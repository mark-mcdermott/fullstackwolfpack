import { describe, expect, it } from 'vitest'
import {
  formatPlaytime,
  gameKey,
  PLAY_XP_DAILY_CAP,
  playtimeRecordRequest,
  xpForPlaySeconds,
} from './playtime'

describe('xpForPlaySeconds', () => {
  it('grants ~1 XP per full minute', () => {
    expect(xpForPlaySeconds(0, 0)).toBe(0)
    expect(xpForPlaySeconds(59, 0)).toBe(0) // sub-minute earns nothing
    expect(xpForPlaySeconds(60, 0)).toBe(1)
    expect(xpForPlaySeconds(600, 0)).toBe(10)
  })

  it('respects the daily cap already earned', () => {
    expect(xpForPlaySeconds(600, PLAY_XP_DAILY_CAP - 3)).toBe(3) // only 3 left
    expect(xpForPlaySeconds(600, PLAY_XP_DAILY_CAP)).toBe(0) // cap reached
  })
})

describe('gameKey', () => {
  it('composes a globally-unique key from source + id', () => {
    expect(gameKey({ source: 'catalog', id: 'snake' })).toBe('catalog:snake')
    expect(gameKey({ source: 'embed', id: '2048' })).toBe('embed:2048')
    // A bare id shared across lanes still yields distinct keys.
    expect(gameKey({ source: 'upload', id: 'snake' })).not.toBe(
      gameKey({ source: 'catalog', id: 'snake' }),
    )
  })
})

describe('formatPlaytime', () => {
  it('renders sub-minute totals as "<1m"', () => {
    expect(formatPlaytime(0)).toBe('<1m')
    expect(formatPlaytime(59)).toBe('<1m')
  })

  it('renders whole minutes under an hour', () => {
    expect(formatPlaytime(60)).toBe('1m')
    expect(formatPlaytime(2520)).toBe('42m')
    expect(formatPlaytime(3599)).toBe('59m')
  })

  it('renders hours with zero-padded minutes', () => {
    expect(formatPlaytime(3600)).toBe('1h 00m')
    expect(formatPlaytime(3660)).toBe('1h 01m')
    expect(formatPlaytime(7325)).toBe('2h 02m')
  })

  it('never returns a negative label', () => {
    expect(formatPlaytime(-100)).toBe('<1m')
  })
})

describe('playtimeRecordRequest', () => {
  const valid = {
    gameId: 'embed:2048',
    source: 'embed' as const,
    title: '2048',
    seconds: 120,
  }

  it('accepts a well-formed flush', () => {
    expect(playtimeRecordRequest.parse(valid)).toEqual(valid)
  })

  it('rejects a zero or negative delta', () => {
    expect(playtimeRecordRequest.safeParse({ ...valid, seconds: 0 }).success).toBe(
      false,
    )
  })

  it('caps a single flush at two hours', () => {
    expect(
      playtimeRecordRequest.safeParse({ ...valid, seconds: 7201 }).success,
    ).toBe(false)
  })

  it('rejects an unknown source lane', () => {
    expect(
      playtimeRecordRequest.safeParse({ ...valid, source: 'arcade' }).success,
    ).toBe(false)
  })
})
