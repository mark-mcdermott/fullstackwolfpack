import { eq } from 'drizzle-orm'
import { db } from '../../src/db'
import { users } from '../../src/db/schema'
import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { publicUser } from '../_lib/user'

// Who's logged in? Used by the client to bootstrap auth state on load.
export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ user: null }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return json({ user: null }, { status: 401 })

  return json({ user: publicUser(user) })
}
