import process from 'node:process'
import { and, eq } from 'drizzle-orm'
import { runGeneration, type EnrollInput } from '@/core/generation'
import { db } from '../db'
import { providerCredentials } from '../db/schema'
import { drizzleCourseStore } from './course-store'
import { decryptSecret } from './crypto'
import { openAiGenerator } from './openai-generator'

// End-to-end: decrypt the user's OpenAI key, generate a course, persist it.
export async function enrollAndGenerate(input: EnrollInput): Promise<string> {
  const cred = await db.query.providerCredentials.findFirst({
    where: and(
      eq(providerCredentials.userId, input.ownerUserId),
      eq(providerCredentials.provider, 'openai'),
    ),
  })
  if (!cred) {
    throw new Error('No OpenAI key on file — add one in Settings.')
  }

  const apiKey = decryptSecret({ ciphertext: cred.ciphertext, iv: cred.iv })
  const generator = openAiGenerator(apiKey, { model: process.env.OPENAI_MODEL })
  return runGeneration({ generator, store: drizzleCourseStore() }, input)
}
