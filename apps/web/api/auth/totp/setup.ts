import { eq } from 'drizzle-orm'
import { db } from '../../../src/db'
import { users } from '../../../src/db/schema'
import { generateTotpSecret, totpAuthUri } from '../../../src/lib/auth'
import { sealSecret } from '../../../src/server/crypto'
import { json } from '../../_lib/http'
import { getSessionUserId } from '../../_lib/session'

// Authed. Mint a secret and store it as pending (not enabled until confirmed).
// Returns the otpauth URI for a QR code plus the base32 secret for manual entry.
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return json({ error: 'unauthorized' }, { status: 401 })

  const secret = generateTotpSecret()
  await db
    .update(users)
    .set({ totpSecret: sealSecret(secret), totpEnabled: false })
    .where(eq(users.id, userId))

  // The plaintext secret is returned once (QR / manual entry); only the sealed
  // form is persisted.
  return json({ uri: totpAuthUri(user.email, secret), secret })
}
