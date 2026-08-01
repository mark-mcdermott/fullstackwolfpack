// Small helpers so each function reads like a request handler, not plumbing.

export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers)
  headers.set('content-type', 'application/json')
  return new Response(JSON.stringify(data), { ...init, headers })
}

// 429 with a Retry-After header (in seconds), for rate-limited endpoints.
export function tooManyRequests(retryAfterMs: number): Response {
  return json(
    { error: 'too many attempts — try again later' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    },
  )
}
