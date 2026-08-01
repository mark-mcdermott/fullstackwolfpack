import type { PublicUser } from '@/core/schemas'
import type { User } from '@/db/schema'

// Shared with the client via src/core/schemas — one definition of the user
// shape. Never leak the TOTP secret or internal columns.
export type { PublicUser }

export function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    totpEnabled: u.totpEnabled,
    role: u.role,
    tier: u.tier,
  }
}
