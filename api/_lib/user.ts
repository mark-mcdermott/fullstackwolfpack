import type { PublicUser } from '../../src/core/schemas'
import type { User } from '../../src/db/schema'

// Shared with the client via src/core/schemas — one definition of the user
// shape. Never leak the TOTP secret or internal columns.
export type { PublicUser }

export function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    totpEnabled: u.totpEnabled,
  }
}
