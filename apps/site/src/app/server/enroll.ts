import process from 'node:process'
import { and, eq } from 'drizzle-orm'
import {
  runGeneration,
  type EnrollInput,
  type LessonGenerator,
} from '../core/generation'
import { db } from '../db'
import { providerCredentials } from '../db/schema'
import { drizzleCourseStore } from './course-store'
import { decryptSecret, type Encrypted } from './crypto'
import { recordGenerationTiming } from './generation-timing'
import { openAiGenerator } from './openai-generator'

// Resolve an OpenAI key from a stored credential + the platform env key. Pure
// (takes the decrypt fn) so the branches are unit-testable. A stored key that
// can't be decrypted — e.g. it was encrypted under a since-rotated
// ENCRYPTION_KEY — is treated as absent and we fall back to the env key rather
// than surfacing a raw "unable to authenticate data" crypto error.
export function pickOpenAiKey(
  cred: Encrypted | null,
  envKey: string | undefined,
  decrypt: (enc: Encrypted) => string = decryptSecret,
): string {
  if (cred) {
    try {
      return decrypt(cred)
    } catch {
      // Undecryptable stored key — fall through to the platform key.
    }
  }
  if (envKey) return envKey
  throw new Error(
    cred
      ? "Your saved OpenAI key couldn't be read — please re-enter it in Settings."
      : 'No OpenAI key on file — add one in Settings.',
  )
}

// Build a generator bound to a user's OpenAI key (their stored key, else the
// platform env key). Shared by enroll + tailor so the key resolution lives once.
export async function userGenerator(userId: string): Promise<LessonGenerator> {
  const cred = await db.query.providerCredentials.findFirst({
    where: and(
      eq(providerCredentials.userId, userId),
      eq(providerCredentials.provider, 'openai'),
    ),
  })
  const apiKey = pickOpenAiKey(cred ?? null, process.env.OPENAI_API_KEY)
  return openAiGenerator(apiKey, { model: process.env.OPENAI_MODEL })
}

// End-to-end: resolve an OpenAI key, generate a course, persist it.
export async function enrollAndGenerate(input: EnrollInput): Promise<string> {
  const generator = await userGenerator(input.ownerUserId)

  // Time the generation so the Generate-course progress bar can show a
  // data-driven ETA (running average of recorded durations).
  const startedAt = Date.now()
  try {
    const courseId = await runGeneration(
      { generator, store: drizzleCourseStore() },
      input,
    )
    await recordGenerationTiming({
      topicId: input.topicId,
      difficulty: input.difficulty,
      durationMs: Date.now() - startedAt,
      succeeded: true,
    })
    return courseId
  } catch (err) {
    await recordGenerationTiming({
      topicId: input.topicId,
      difficulty: input.difficulty,
      durationMs: Date.now() - startedAt,
      succeeded: false,
    })
    throw err
  }
}
