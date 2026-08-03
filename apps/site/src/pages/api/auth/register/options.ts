import type { APIRoute } from 'astro'
export const prerender = false

import { generateRegistrationOptions } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { registerOptionsRequest } from '@/core/schemas'
import { db } from '@/db'
import { credentials, users, webauthnChallenges } from '@/db/schema'
import { rpID, rpName } from '@/lib/auth'
import { json } from '../../_lib/http'
import { parseBody } from '../../_lib/validate'

const CHALLENGE_TTL_MS = 5 * 60_000

// Step 1 of registration: create/find the user, hand the browser a challenge.
export const POST: APIRoute = async ({ request: req }) => {
  const parsed = await parseBody(registerOptionsRequest, req)
  if (!parsed.ok) return parsed.response
  const { email, displayName } = parsed.data

  const [user] = await db
    .insert(users)
    .values({ email, displayName })
    .onConflictDoUpdate({ target: users.email, set: { displayName } })
    .returning()

  // Don't let the user register a passkey they already have on this account.
  const existing = await db.query.credentials.findMany({
    where: eq(credentials.userId, user.id),
  })

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: email,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
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
