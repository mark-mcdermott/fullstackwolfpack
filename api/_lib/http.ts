// Small helpers so each function reads like a request handler, not plumbing.

export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers)
  headers.set('content-type', 'application/json')
  return new Response(JSON.stringify(data), { ...init, headers })
}
