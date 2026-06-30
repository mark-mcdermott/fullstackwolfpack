import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { loginOptionsRequest } from '../../../src/core/schemas'
import { db } from '../../../src/db'
import { credentials, users, webauthnChallenges } from '../../../src/db/schema'
import { rpID } from '../../../src/lib/auth'
import { json } from '../../_lib/http'
import { parseBody } from '../../_lib/validate'

const CHALLENGE_TTL_MS = 5 * 60_000

// Step 1 of login: hand the browser a challenge + the user's known credentials.
export async function POST(req: Request): Promise<Response> {
  const parsed = await parseBody(loginOptionsRequest, req)
  if (!parsed.ok) return parsed.response
  const { email } = parsed.data

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) return json({ error: 'no account for that email' }, { status: 404 })

  const creds = await db.query.credentials.findMany({
    where: eq(credentials.userId, user.id),
  })

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: creds.map((c) => ({
      id: c.id,
      transports: c.transports
        ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[])
        : undefined,
    })),
    userVerification: 'preferred',
  })

  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS)
  await db
    .insert(webauthnChallenges)
    .values({ key: email, challenge: options.challenge, expiresAt })
    .onConflictDoUpdate({
      target: webauthnChallenges.key,
      set: { challenge: options.challenge, expiresAt },
    })

  return json(options)
}
