import type { User } from '../../src/db/schema'

// Never leak the TOTP secret or internal columns to the client.
export type PublicUser = {
  id: string
  email: string
  displayName: string
  totpEnabled: boolean
}

export function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    totpEnabled: u.totpEnabled,
  }
}
