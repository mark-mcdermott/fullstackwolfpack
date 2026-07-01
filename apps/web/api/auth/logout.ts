import { json } from '../_lib/http'
import { clearSessionCookie } from '../_lib/session'

export async function POST(): Promise<Response> {
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}
