import type { Role, Tier } from '../../src/core/access'
import type { User } from '../../src/db/schema'

// Never leak the TOTP secret or internal columns to the client.
export type PublicUser = {
  id: string
  email: string
  displayName: string
  totpEnabled: boolean
  role: Role
  tier: Tier
}

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
