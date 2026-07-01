// Dev Mode role switcher — server side. Off by default: enabled only in local
// dev, or in any environment where VITE_ENABLE_DEV_MODE=1 is explicitly set
// (opt-in, e.g. a preview/prod deploy). Deleted-later feature.
//
// SECURITY: while enabled, POST /api/me/become mints a session for a test user
// with NO authentication — anyone who can reach it can become admin. It stays
// 404 unless devModeEnabled() returns true, so a plain production deploy (no
// flag) never exposes it and never creates a test user.
import { db } from '../../src/db'
import { users } from '../../src/db/schema'
import {
  DEV_ROLE_ACCESS,
  isDevLoginRole,
  type DevLoginRole,
} from '../../src/core/dev-mode'
import { json } from './http'
import { createSessionCookie } from './session'

type DevUser = { email: string; displayName: string }

// Obviously-fake identities (example.com is reserved for exactly this).
export const DEV_USERS: Record<DevLoginRole, DevUser> = {
  unpaid: { email: 'dev-unpaid@example.com', displayName: 'Dev Unpaid' },
  paid: { email: 'dev-paid@example.com', displayName: 'Dev Paid' },
  admin: { email: 'dev-admin@example.com', displayName: 'Dev Admin' },
}

// Enabled in local dev, or anywhere VITE_ENABLE_DEV_MODE=1 is explicitly set.
export function devModeEnabled(): boolean {
  if (process.env.VITE_ENABLE_DEV_MODE === '1') return true
  const origin = process.env.RP_ORIGIN ?? 'http://localhost:5173'
  return !origin.startsWith('https') && process.env.NODE_ENV !== 'production'
}

// Upsert by email so the id (and therefore all progress) stays stable across
// switches, while role/tier self-heal to the expected values.
async function ensureDevUser(role: DevLoginRole) {
  const { email, displayName } = DEV_USERS[role]
  const access = DEV_ROLE_ACCESS[role]
  const [user] = await db
    .insert(users)
    .values({ email, displayName, ...access })
    .onConflictDoUpdate({ target: users.email, set: { displayName, ...access } })
    .returning()
  return user
}

// POST /api/me/become — mint a session for a seeded test user. Unauthenticated
// by design (it creates the session); gated by devModeEnabled().
export async function devBecome(req: Request): Promise<Response> {
  if (!devModeEnabled()) return json({ error: 'not found' }, { status: 404 })

  const body: unknown = await req.json().catch(() => null)
  const role =
    body && typeof body === 'object' ? (body as { role?: unknown }).role : undefined
  if (!isDevLoginRole(role)) {
    return json({ error: 'unknown dev role' }, { status: 400 })
  }

  const user = await ensureDevUser(role)
  return json(
    { ok: true },
    { headers: { 'Set-Cookie': await createSessionCookie(user.id) } },
  )
}
