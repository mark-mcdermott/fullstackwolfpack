import { eq } from 'drizzle-orm'
import { totpEnableRequest } from '../../../src/core/schemas'
import { db } from '../../../src/db'
import { users } from '../../../src/db/schema'
import { verifyTotp } from '../../../src/lib/auth'
import { json } from '../../_lib/http'
import { getSessionUserId } from '../../_lib/session'
import { parseBody } from '../../_lib/validate'

// Authed. Confirm the user can produce a valid code before turning TOTP on.
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const parsed = await parseBody(totpEnableRequest, req)
  if (!parsed.ok) return parsed.response
  const { token } = parsed.data

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user?.totpSecret) {
    return json({ error: 'no pending TOTP secret — run setup first' }, { status: 400 })
  }

  if (!(await verifyTotp(token, user.totpSecret))) {
    return json({ error: 'invalid code' }, { status: 400 })
  }

  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, userId))
  return json({ enabled: true })
}
