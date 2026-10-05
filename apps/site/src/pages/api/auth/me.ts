import type { APIRoute } from 'astro'
export const prerender = false

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user as authUser, users } from '@/db/schema'
import { getAuth } from '@/server/auth'
import { json } from '../_lib/http'
import { publicUser } from '../_lib/user'

// GET /api/auth/me — the signed-in user as every surface agrees to see them.
//
// A named route rather than part of better-auth's [...all] catch-all, which it
// outranks: better-auth's own get-session returns its `user`, and the app needs
// the profile row joined to it (role, tier, displayName).

export const GET: APIRoute = async ({ request: req }) => {
  const session = await getAuth().api.getSession({ headers: req.headers })
  if (!session) return json({ user: null })

  const [row] = await db
    .select({ profile: users, emailVerified: authUser.emailVerified })
    .from(users)
    .innerJoin(authUser, eq(authUser.id, users.id))
    .where(eq(users.id, session.user.id))
    .limit(1)

  // Signed in with no profile row means the create hook did not finish — treat
  // it as signed out rather than inventing a half-user.
  if (!row) return json({ user: null })

  return json({ user: publicUser(row.profile, row.emailVerified) })
}
