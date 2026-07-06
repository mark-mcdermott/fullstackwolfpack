import { describe, expect, it } from 'vitest'
import { isOnline, PRESENCE_WINDOW_MS } from './social'

describe('isOnline', () => {
  const now = 1_700_000_000_000

  it('treats a missing timestamp as offline', () => {
    expect(isOnline(null, now)).toBe(false)
  })

  it('is online within the presence window', () => {
    expect(isOnline(new Date(now - 30_000).toISOString(), now)).toBe(true)
  })

  it('is offline past the presence window', () => {
    expect(
      isOnline(new Date(now - PRESENCE_WINDOW_MS - 1_000).toISOString(), now),
    ).toBe(false)
  })

  it('treats an unparseable timestamp as offline', () => {
    expect(isOnline('not-a-date', now)).toBe(false)
  })
})
