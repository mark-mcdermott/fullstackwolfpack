import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { passkeyVerifyRequest } from '../../../src/core/schemas'
import { db } from '../../../src/db'
import { credentials, users, webauthnChallenges } from '../../../src/db/schema'
import { origin, rpID } from '../../../src/lib/auth'
import { json } from '../../_lib/http'
import { createSessionCookie } from '../../_lib/session'
import { publicUser } from '../../_lib/user'
import { parseBody } from '../../_lib/validate'

// Step 2 of registration: verify the signed attestation, store the public key,
// and start a session.
export async function POST(req: Request): Promise<Response> {
  const parsed = await parseBody(passkeyVerifyRequest, req)
  if (!parsed.ok) return parsed.response
  const { email } = parsed.data
  const response = parsed.data.response as RegistrationResponseJSON

  const challenge = await db.query.webauthnChallenges.findFirst({
    where: eq(webauthnChallenges.key, email),
  })
  if (!challenge || challenge.expiresAt < new Date()) {
    return json({ error: 'challenge missing or expired' }, { status: 400 })
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) return json({ error: 'user not found' }, { status: 400 })

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    })
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 400 })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return json({ error: 'registration could not be verified' }, { status: 400 })
  }

  const { credential } = verification.registrationInfo
  await db
    .insert(credentials)
    .values({
      id: credential.id,
      userId: user.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: JSON.stringify(credential.transports ?? []),
    })
    .onConflictDoNothing()

  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.key, email))

  return json(
    { verified: true, user: publicUser(user) },
    { headers: { 'Set-Cookie': await createSessionCookie(user.id) } },
  )
}
