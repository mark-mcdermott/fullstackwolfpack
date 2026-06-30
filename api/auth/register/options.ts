import { generateRegistrationOptions } from '@simplewebauthn/server'
import { eq } from 'drizzle-orm'
import { db } from '../../../src/db'
import { credentials, users, webauthnChallenges } from '../../../src/db/schema'
import { rpID, rpName } from '../../../src/lib/auth'
import { json, readJson } from '../../_lib/http'

const CHALLENGE_TTL_MS = 5 * 60_000

// Step 1 of registration: create/find the user, hand the browser a challenge.
export async function POST(req: Request): Promise<Response> {
  const { email, displayName } = await readJson<{
    email?: string
    displayName?: string
  }>(req)
  if (!email || !displayName) {
    return json({ error: 'email and displayName are required' }, { status: 400 })
  }

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
