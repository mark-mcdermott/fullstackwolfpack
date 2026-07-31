// Dev-only role switcher — pure, framework-agnostic bits shared by the widget
// and the dev endpoint. NO server imports here (this file reaches the client
// bundle); the DB upsert lives in api/_dev/users.ts. Deleted-later feature.

import { isAdmin, isPaid, type Principal, type Role, type Tier } from './access'

// Left → right positions on the switch. "off" means logged out.
export const DEV_ROLES = ['off', 'unpaid', 'paid', 'admin'] as const
export type DevRole = (typeof DEV_ROLES)[number]

// The three positions that log you in as a seeded test user.
export const DEV_LOGIN_ROLES = ['unpaid', 'paid', 'admin'] as const
export type DevLoginRole = (typeof DEV_LOGIN_ROLES)[number]

export const DEV_ROLE_LABELS: Record<DevRole, string> = {
  off: 'None',
  unpaid: 'Unpaid',
  paid: 'Paid',
  admin: 'Admin',
}

// Each logged-in position maps to a concrete {role, tier} the test user carries.
export const DEV_ROLE_ACCESS: Record<DevLoginRole, { role: Role; tier: Tier }> = {
  unpaid: { role: 'user', tier: 'free' },
  paid: { role: 'user', tier: 'pro' },
  admin: { role: 'admin', tier: 'pro' },
}

export function isDevLoginRole(value: unknown): value is DevLoginRole {
  return (
    typeof value === 'string' &&
    (DEV_LOGIN_ROLES as readonly string[]).includes(value)
  )
}

// Which switch position reflects the current user. Logged out → "off";
// admins → "admin"; otherwise paid vs unpaid by tier. Deriving from the live
// user means a normal sign-out snaps the switch back to "off" on its own.
export function resolveDevRole(user: Principal | null): DevRole {
  if (!user) return 'off'
  if (isAdmin(user)) return 'admin'
  if (isPaid(user)) return 'paid'
  return 'unpaid'
}
