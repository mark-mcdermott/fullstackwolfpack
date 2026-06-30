import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../src/db'
import { credentials, users, webauthnChallenges } from '../../../src/db/schema'
import { origin, rpID } from '../../../src/lib/auth'
import { json, readJson } from '../../_lib/http'
import { createSessionCookie } from '../../_lib/session'
import { publicUser } from '../../_lib/user'

// Step 2 of login: verify the assertion against the stored public key, bump the
// signature counter (clone detection), and start a session.
export async function POST(req: Request): Promise<Response> {
  const { email, response } = await readJson<{
    email?: string
    response?: AuthenticationResponseJSON
  }>(req)
  if (!email || !response) {
    return json({ error: 'email and response are required' }, { status: 400 })
  }

  const challenge = await db.query.webauthnChallenges.findFirst({
    where: eq(webauthnChallenges.key, email),
  })
  if (!challenge || challenge.expiresAt < new Date()) {
    return json({ error: 'challenge missing or expired' }, { status: 400 })
  }

  const cred = await db.query.credentials.findFirst({
    where: eq(credentials.id, response.id),
  })
  if (!cred) return json({ error: 'unknown credential' }, { status: 400 })

  const user = await db.query.users.findFirst({ where: eq(users.id, cred.userId) })
  if (!user || user.email !== email) {
    return json({ error: 'credential does not match account' }, { status: 400 })
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.id,
        publicKey: new Uint8Array(Buffer.from(cred.publicKey, 'base64url')),
        counter: cred.counter,
        transports: cred.transports
          ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
          : undefined,
      },
      requireUserVerification: false,
    })
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 400 })
  }

  if (!verification.verified) {
    return json({ error: 'login could not be verified' }, { status: 400 })
  }

  await db
    .update(credentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(credentials.id, cred.id))

  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.key, email))

  return json(
    { verified: true, user: publicUser(user) },
    { headers: { 'Set-Cookie': await createSessionCookie(user.id) } },
  )
}
