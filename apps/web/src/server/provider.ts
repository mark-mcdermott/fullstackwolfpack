import process from 'node:process'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { providerCredentials } from '../db/schema'
import { decryptSecret, encryptSecret } from './crypto'

// Provider resolution for the tutor + grader seams. Kept separate from the
// (main-owned) server/provider-credentials.ts so this pane adds provider support
// additively. BYO keys are stored per-user, encrypted at rest, exactly like the
// OpenAI key; an env platform key is a fallback so the features are testable from
// .env alone.

export type LlmProvider = 'anthropic' | 'openai'
export type ResolvedProvider = { provider: LlmProvider; apiKey: string }

// Read + decrypt a per-user key for one provider (null if none on file).
async function userKey(userId: string, provider: LlmProvider): Promise<string | null> {
  const cred = await db.query.providerCredentials.findFirst({
    where: and(
      eq(providerCredentials.userId, userId),
      eq(providerCredentials.provider, provider),
    ),
  })
  if (!cred) return null
  return decryptSecret({ ciphertext: cred.ciphertext, iv: cred.iv })
}

// Pick the provider to use, in order: the user's own Anthropic key (Claude is the
// preferred provider — see docs/education-system.md §5), then their OpenAI key,
// then a platform key from the environment. Returns null when nothing is available.
export async function resolveProvider(userId: string): Promise<ResolvedProvider | null> {
  const anthropicUser = await userKey(userId, 'anthropic')
  if (anthropicUser) return { provider: 'anthropic', apiKey: anthropicUser }

  const openaiUser = await userKey(userId, 'openai')
  if (openaiUser) return { provider: 'openai', apiKey: openaiUser }

  const envAnthropic = process.env.ANTHROPIC_API_KEY
  if (envAnthropic) return { provider: 'anthropic', apiKey: envAnthropic }

  const envOpenai = process.env.OPENAI_API_KEY
  if (envOpenai) return { provider: 'openai', apiKey: envOpenai }

  return null
}

// Encrypt + upsert a per-user key for a provider (write-only, like the OpenAI key).
export async function saveProviderKey(
  userId: string,
  provider: LlmProvider,
  apiKey: string,
): Promise<void> {
  const { ciphertext, iv } = encryptSecret(apiKey)
  await db
    .insert(providerCredentials)
    .values({ userId, provider, ciphertext, iv })
    .onConflictDoUpdate({
      target: [providerCredentials.userId, providerCredentials.provider],
      set: { ciphertext, iv, updatedAt: new Date() },
    })
}

export async function hasProviderKey(
  userId: string,
  provider: LlmProvider,
): Promise<boolean> {
  const cred = await db.query.providerCredentials.findFirst({
    where: and(
      eq(providerCredentials.userId, userId),
      eq(providerCredentials.provider, provider),
    ),
    columns: { id: true },
  })
  return Boolean(cred)
}
