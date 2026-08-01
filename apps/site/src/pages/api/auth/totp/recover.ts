import type { APIRoute } from 'astro'
export const prerender = false

import { eq } from 'drizzle-orm'
import { recoverRequest } from '@/core/schemas'
import { db } from '@/db'
import { users } from '@/db/schema'
import { verifyTotp } from '@/lib/auth'
import { openSecret } from '@/server/crypto'
import { checkRateLimit } from '@/server/rate-limit'
import { json, tooManyRequests } from '../../_lib/http'
import { createSessionCookie } from '../../_lib/session'
import { publicUser } from '../../_lib/user'
import { parseBody } from '../../_lib/validate'

const RECOVER_LIMIT = { limit: 5, windowMs: 15 * 60_000 }

// Unauthed recovery path: the TOTP code stands in for a lost passkey and
// starts a session. (Production: rate-limit this and the login endpoints.)
export const POST: APIRoute = async ({ request: req }) => {
  const parsed = await parseBody(recoverRequest, req)
  if (!parsed.ok) return parsed.response
  const { email, token } = parsed.data

  const rl = await checkRateLimit(`recover:${email.toLowerCase()}`, RECOVER_LIMIT)
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs)

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user?.totpEnabled || !user.totpSecret) {
    return json({ error: 'TOTP is not enabled for this account' }, { status: 400 })
  }

  if (!(await verifyTotp(token, openSecret(user.totpSecret)))) {
    return json({ error: 'invalid code' }, { status: 400 })
  }

  return json(
    { verified: true, user: publicUser(user) },
    { headers: { 'Set-Cookie': await createSessionCookie(user.id) } },
  )
}
