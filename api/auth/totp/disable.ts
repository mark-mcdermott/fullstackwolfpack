import { eq } from 'drizzle-orm'
import { db } from '../../../src/db'
import { users } from '../../../src/db/schema'
import { json } from '../../_lib/http'
import { getSessionUserId } from '../../_lib/session'

// Authed. Forget the secret and turn TOTP off.
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  await db
    .update(users)
    .set({ totpSecret: null, totpEnabled: false })
    .where(eq(users.id, userId))

  return json({ disabled: true })
}
