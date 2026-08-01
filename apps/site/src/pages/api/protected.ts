import type { APIRoute } from 'astro'
export const prerender = false

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { json } from './_lib/http'
import { getSessionUserId } from './_lib/session'

// The real security boundary: gated by the session cookie, not the client.
// Client-side route guards are UX; this is what actually protects the data.
export const GET: APIRoute = async ({ request: req }) => {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return json({ error: 'unauthorized' }, { status: 401 })

  return json({
    message: `Welcome to the protected area, ${user.displayName}.`,
    memberSince: user.createdAt,
  })
}
