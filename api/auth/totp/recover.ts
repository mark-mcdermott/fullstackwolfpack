import { eq } from 'drizzle-orm'
import { db } from '../../../src/db'
import { users } from '../../../src/db/schema'
import { verifyTotp } from '../../../src/lib/auth'
import { json, readJson } from '../../_lib/http'
import { createSessionCookie } from '../../_lib/session'
import { publicUser } from '../../_lib/user'

// Unauthed recovery path: the TOTP code stands in for a lost passkey and
// starts a session. (Production: rate-limit this and the login endpoints.)
export async function POST(req: Request): Promise<Response> {
  const { email, token } = await readJson<{ email?: string; token?: string }>(req)
  if (!email || !token) {
    return json({ error: 'email and token are required' }, { status: 400 })
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user?.totpEnabled || !user.totpSecret) {
    return json({ error: 'TOTP is not enabled for this account' }, { status: 400 })
  }

  if (!(await verifyTotp(token, user.totpSecret))) {
    return json({ error: 'invalid code' }, { status: 400 })
  }

  return json(
    { verified: true, user: publicUser(user) },
    { headers: { 'Set-Cookie': await createSessionCookie(user.id) } },
  )
}
