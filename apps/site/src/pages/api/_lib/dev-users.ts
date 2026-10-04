// Dev Mode role switcher — server side. Off by default: enabled only in local
// dev, or in any environment where VITE_ENABLE_DEV_MODE=1 is explicitly set
// (opt-in, e.g. a preview/prod deploy). Deleted-later feature.
//
// SECURITY: while enabled, POST /api/me/become signs in a test user with NO
// authentication — anyone who can reach it can become admin. It stays
// 404 unless devModeEnabled() returns true, so a plain production deploy (no
// flag) never exposes it and never creates a test user.
import { db } from '@/db'
import { users } from '@/db/schema'
import {
  DEV_ROLE_ACCESS,
  isDevLoginRole,
  type DevLoginRole,
} from '@/core/dev-mode'
import { json } from './http'
import { eq } from 'drizzle-orm'
import { getAuth } from '@/server/auth'

type DevUser = { email: string; displayName: string }

// These identities only exist where Dev Mode is on, and the password is not a
// secret — it is here so `become` can go through Better Auth's real sign-in
// rather than forging a session, which is no longer ours to forge.
const DEV_PASSWORD = 'dev-mode-not-a-secret'

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

// Sign in through Better Auth, creating the account on first use. The id (and
// therefore all progress) stays stable across switches, while role/tier
// self-heal to the expected values on the profile row.
async function becomeDevUser(role: DevLoginRole): Promise<Response> {
  const { email, displayName } = DEV_USERS[role]
  const auth = getAuth()
  const body = { email, password: DEV_PASSWORD }

  let res = await auth.api.signInEmail({ body, asResponse: true })
  if (!res.ok) {
    // First switch to this role: no account yet.
    await auth.api.signUpEmail({
      body: { ...body, name: displayName },
      asResponse: true,
    })
    res = await auth.api.signInEmail({ body, asResponse: true })
  }

  // The databaseHooks created the profile row; Dev Mode owns its access level.
  await db
    .update(users)
    .set({ displayName, ...DEV_ROLE_ACCESS[role] })
    .where(eq(users.email, email))

  return res
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

  const signedIn = await becomeDevUser(role)
  if (!signedIn.ok) {
    return json({ error: 'could not sign in the dev user' }, { status: 500 })
  }
  // Pass Better Auth's own Set-Cookie straight through.
  const headers = new Headers()
  for (const cookie of signedIn.headers.getSetCookie()) {
    headers.append('Set-Cookie', cookie)
  }
  return json({ ok: true }, { headers })
}
