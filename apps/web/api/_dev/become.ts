// Dev-only endpoint: mint a session for a seeded test user (or clear it).
// Reachable only through the dev-api Vite plugin under `npm run dev`; the
// api/_dev dir is underscore-ignored by Vercel, so this is never deployed.
// Deleted-later feature.
import { json } from '../_lib/http'
import { createSessionCookie } from '../_lib/session'
import { isDevLoginRole } from '../../src/core/dev-mode'

// Belt-and-suspenders: allow ONLY in a genuine local dev context — the origin
// must be non-https AND NODE_ENV must not be production. Refuse otherwise.
// (This route also only exists via the dev-only Vite plugin and is never
// deployed, but a positive dev signal keeps it from ever minting a session in
// a misconfigured environment that leaves RP_ORIGIN unset.)
function devAllowed(): boolean {
  const origin = process.env.RP_ORIGIN ?? 'http://localhost:5173'
  return !origin.startsWith('https') && process.env.NODE_ENV !== 'production'
}

export async function POST(req: Request): Promise<Response> {
  if (!devAllowed()) return json({ error: 'not found' }, { status: 404 })

  const body: unknown = await req.json().catch(() => null)
  const role =
    body && typeof body === 'object' ? (body as { role?: unknown }).role : undefined

  // The UI handles "off" by calling logout() directly; this endpoint only
  // mints sessions for the three login roles.
  if (!isDevLoginRole(role)) {
    return json({ error: 'unknown dev role' }, { status: 400 })
  }

  // Loaded lazily so the guard/validation paths above never pull in the DB
  // client (which needs DATABASE_URL just to construct).
  const { ensureDevUser } = await import('./users')
  const user = await ensureDevUser(role)
  return json(
    { ok: true },
    { headers: { 'Set-Cookie': await createSessionCookie(user.id) } },
  )
}
