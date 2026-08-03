import type { APIRoute } from 'astro'
export const prerender = false

import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { loginOptionsRequest } from '@/core/schemas'
import { db } from '@/db'
import { credentials, users, webauthnChallenges } from '@/db/schema'
import { rpID } from '@/lib/auth'
import { checkRateLimit } from '@/server/rate-limit'
import { json, tooManyRequests } from '../../_lib/http'
import { parseBody } from '../../_lib/validate'

const CHALLENGE_TTL_MS = 5 * 60_000
const LOGIN_LIMIT = { limit: 10, windowMs: 15 * 60_000 }

// Step 1 of login: hand the browser a challenge + the user's known credentials.
export const POST: APIRoute = async ({ request: req }) => {
  const parsed = await parseBody(loginOptionsRequest, req)
  if (!parsed.ok) return parsed.response
  const { email } = parsed.data

  const rl = await checkRateLimit(`login:${email.toLowerCase()}`, LOGIN_LIMIT)
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs)

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
