// Run a write the response does not depend on, without holding the response open for
// it.
//
// Every query is its own HTTPS round trip here — the db client is `neon-http`, which
// neither pools nor pipelines — so bookkeeping that nothing reads back is pure latency
// stacked in front of the learner.
//
// The platform hook is read straight off the request context Vercel publishes on the
// registered symbol `@vercel/request-context`. That is the same lookup `waitUntil` from
// `@vercel/functions` performs, and a registered symbol is a cross-package contract by
// construction — but doing it here is what makes the hook *detectable*. `waitUntil`
// resolves the context with optional chaining and silently drops the promise when there
// is none, so a runtime that stopped publishing it would quietly stop writing, with no
// error and no failed request. Resolving it ourselves turns that into a fallback: no
// hook means we await instead, so the worst case is no speedup rather than a lost row.
const REQUEST_CONTEXT = Symbol.for('@vercel/request-context')

type RequestContext = { waitUntil?: (promise: Promise<unknown>) => void }
type ContextStore = { get?: () => RequestContext | undefined } | undefined

function platformWaitUntil(): ((promise: Promise<unknown>) => void) | null {
  const store = (globalThis as unknown as Record<symbol, ContextStore>)[REQUEST_CONTEXT]
  const ctx = store?.get?.()
  return typeof ctx?.waitUntil === 'function' ? ctx.waitUntil.bind(ctx) : null
}

export async function afterResponse(work: Promise<unknown>): Promise<void> {
  // Nothing awaits this on the deferred path, so an unhandled rejection would take down
  // the invocation rather than just the write that failed.
  const guarded = work.then(
    () => undefined,
    (err: unknown) => {
      console.error('[after-response] deferred write failed:', err)
    },
  )

  const defer = platformWaitUntil()
  if (defer) {
    defer(guarded)
    return
  }
  await guarded
}
