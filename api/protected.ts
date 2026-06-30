import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { users } from '../src/db/schema'
import { json } from './_lib/http'
import { getSessionUserId } from './_lib/session'

// The real security boundary: gated by the session cookie, not the client.
// Client-side route guards are UX; this is what actually protects the data.
export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return json({ error: 'unauthorized' }, { status: 401 })

  return json({
    message: `Welcome to the protected area, ${user.displayName}.`,
    memberSince: user.createdAt,
  })
}
