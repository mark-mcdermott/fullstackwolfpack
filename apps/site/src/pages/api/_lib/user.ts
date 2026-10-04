import type { PublicUser } from '@/core/schemas'
import type { User } from '@/db/schema'

// Shared with the client via src/core/schemas — one definition of the user
// shape. Never leak internal columns.
export type { PublicUser }

// `emailVerified` is better-auth's, on the `user` table; everything else is the
// app's, on `users`. Callers join the two and pass the flag in.
export function publicUser(u: User, emailVerified: boolean): PublicUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    emailVerified,
    role: u.role,
    tier: u.tier,
  }
}
