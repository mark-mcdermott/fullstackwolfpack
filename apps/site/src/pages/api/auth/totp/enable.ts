import type { APIRoute } from 'astro'
export const prerender = false

import { eq } from 'drizzle-orm'
import { totpEnableRequest } from '@/core/schemas'
import { db } from '@/db'
import { users } from '@/db/schema'
import { verifyTotp } from '@/lib/auth'
import { openSecret } from '@/server/crypto'
import { json } from '../../_lib/http'
import { getSessionUserId } from '../../_lib/session'
import { parseBody } from '../../_lib/validate'

// Authed. Confirm the user can produce a valid code before turning TOTP on.
export const POST: APIRoute = async ({ request: req }) => {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const parsed = await parseBody(totpEnableRequest, req)
  if (!parsed.ok) return parsed.response
  const { token } = parsed.data

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user?.totpSecret) {
    return json({ error: 'no pending TOTP secret — run setup first' }, { status: 400 })
  }

  if (!(await verifyTotp(token, openSecret(user.totpSecret)))) {
    return json({ error: 'invalid code' }, { status: 400 })
  }

  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, userId))
  return json({ enabled: true })
}
