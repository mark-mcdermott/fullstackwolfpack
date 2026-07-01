import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { providerCredentials } from '../db/schema'
import { encryptSecret } from './crypto'

// Encrypt and upsert the user's OpenAI key. Only ciphertext + iv are stored —
// the plaintext never lands in the DB and is never returned to a client.
export async function saveOpenAiKey(
  userId: string,
  apiKey: string,
): Promise<void> {
  const { ciphertext, iv } = encryptSecret(apiKey)
  await db
    .insert(providerCredentials)
    .values({ userId, provider: 'openai', ciphertext, iv })
    .onConflictDoUpdate({
      target: [providerCredentials.userId, providerCredentials.provider],
      set: { ciphertext, iv, updatedAt: new Date() },
    })
}

export async function hasOpenAiKey(userId: string): Promise<boolean> {
  const cred = await db.query.providerCredentials.findFirst({
    where: and(
      eq(providerCredentials.userId, userId),
      eq(providerCredentials.provider, 'openai'),
    ),
    columns: { id: true },
  })
  return Boolean(cred)
}
