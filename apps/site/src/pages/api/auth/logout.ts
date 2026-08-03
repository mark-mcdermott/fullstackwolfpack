import type { APIRoute } from 'astro'
export const prerender = false

import { json } from '../_lib/http'
import { clearSessionCookie } from '../_lib/session'

export const POST: APIRoute = async () => {
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}
