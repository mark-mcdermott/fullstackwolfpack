// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isRealtimeEnabled, publishToUser } from './realtime'

describe('realtime gate', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is disabled when ABLY_API_KEY is unset', () => {
    vi.stubEnv('ABLY_API_KEY', '')
    expect(isRealtimeEnabled()).toBe(false)
  })

  it('is enabled when a key is set', () => {
    vi.stubEnv('ABLY_API_KEY', 'fake.key:secret')
    expect(isRealtimeEnabled()).toBe(true)
  })

  it('publishToUser is a no-op (never throws) when disabled', async () => {
    vi.stubEnv('ABLY_API_KEY', '')
    await expect(
      publishToUser('u1', { type: 'message', fromUserId: 'u2' }),
    ).resolves.toBeUndefined()
  })
})
