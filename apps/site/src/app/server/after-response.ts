import process from 'node:process'
import { waitUntil } from '@vercel/functions'

// Run a write the response does not depend on, without holding the response open for
// it.
//
// Every query is its own HTTPS round trip here — the db client is `neon-http`, which
// neither pools nor pipelines — so bookkeeping that nothing reads back is pure latency
// stacked in front of the learner. `waitUntil` hands the promise to the platform, which
// keeps the invocation alive until it settles, after the response has already gone out.
//
// Off Vercel there is no such hook, and Vercel's own `waitUntil` *silently drops* the
// promise when there is no request context, so `astro dev` and vitest await instead.
// That gives back the latency this exists to remove, but only where nobody is timing
// it, and it keeps the writes deterministic under test.
export async function afterResponse(work: Promise<unknown>): Promise<void> {
  // On the deferred path nothing is awaiting this, so an unhandled rejection would
  // take down the whole invocation rather than just the write that failed.
  const guarded = work.then(
    () => undefined,
    (err: unknown) => {
      console.error('[after-response] deferred write failed:', err)
    },
  )
  if (process.env.VERCEL) {
    waitUntil(guarded)
    return
  }
  await guarded
}
