// Dev-only test users for the Dev Mode switcher. This lives under api/_dev,
// which Vercel ignores (underscore-prefixed) — it is NEVER deployed as a
// serverless function. Deleted-later feature.
import { db } from '../../src/db'
import { users } from '../../src/db/schema'
import {
  DEV_ROLE_ACCESS,
  type DevLoginRole,
} from '../../src/core/dev-mode'

type DevUser = { email: string; displayName: string }

// Obviously-fake identities (example.com is reserved for exactly this).
export const DEV_USERS: Record<DevLoginRole, DevUser> = {
  unpaid: { email: 'dev-unpaid@example.com', displayName: 'Dev Unpaid' },
  paid: { email: 'dev-paid@example.com', displayName: 'Dev Paid' },
  admin: { email: 'dev-admin@example.com', displayName: 'Dev Admin' },
}

// Upsert the test user by email so its id (and therefore all its progress)
// stays stable across switches, while role/tier self-heal to the expected
// values even if they were changed via the admin UI.
export async function ensureDevUser(role: DevLoginRole) {
  const { email, displayName } = DEV_USERS[role]
  const access = DEV_ROLE_ACCESS[role]
  const [user] = await db
    .insert(users)
    .values({ email, displayName, ...access })
    .onConflictDoUpdate({ target: users.email, set: { displayName, ...access } })
    .returning()
  return user
}
