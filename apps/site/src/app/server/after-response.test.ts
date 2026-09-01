import { afterEach, describe, expect, it, vi } from 'vitest'
import { afterResponse } from './after-response'

// The branch that decides whether a write survives. It used to be chosen by sniffing
// `process.env.VERCEL`, which no test could meaningfully exercise; reading the request
// context directly makes both halves reachable here.

const REQUEST_CONTEXT = Symbol.for('@vercel/request-context')

type ContextStore = { get: () => unknown } | undefined
const store = globalThis as unknown as Record<symbol, ContextStore>

function publishContext(ctx: unknown): void {
  store[REQUEST_CONTEXT] = { get: () => ctx }
}

afterEach(() => {
  delete store[REQUEST_CONTEXT]
})

describe('afterResponse', () => {
  it('hands the work to the platform and returns without waiting for it', async () => {
    const waitUntil = vi.fn()
    publishContext({ waitUntil })

    let done = false
    await afterResponse(new Promise<void>((r) => setTimeout(() => ((done = true), r()), 5)))

    expect(waitUntil).toHaveBeenCalledOnce()
    expect(done).toBe(false)
  })

  // The point of resolving the context ourselves. `waitUntil` would have accepted the
  // promise and dropped it; here a missing hook costs latency, never a row.
  it('awaits the work when no request context is published', async () => {
    let done = false
    await afterResponse(Promise.resolve().then(() => void (done = true)))
    expect(done).toBe(true)
  })

  it('awaits when a context exists but offers no waitUntil', async () => {
    publishContext({})
    let done = false
    await afterResponse(Promise.resolve().then(() => void (done = true)))
    expect(done).toBe(true)
  })

  it('contains a failed write rather than rejecting the caller', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(afterResponse(Promise.reject(new Error('neon down')))).resolves.toBeUndefined()
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})
