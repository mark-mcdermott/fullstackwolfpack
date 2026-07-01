import { eq } from 'drizzle-orm'
import { enrollRequest } from '../../src/core/schemas'
import { db } from '../../src/db'
import { topics } from '../../src/db/schema'
import { enrollAndGenerate } from '../../src/server/enroll'
import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { parseBody } from '../_lib/validate'

// Enroll the user in a topic and generate its AI course. Calls OpenAI, so it's
// slow and needs the user's key on file (added in Settings).
export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  const parsed = await parseBody(enrollRequest, req)
  if (!parsed.ok) return parsed.response
  const { topicSlug, difficulty } = parsed.data

  const topic = await db.query.topics.findFirst({
    where: eq(topics.slug, topicSlug),
  })
  if (!topic) return json({ error: 'unknown topic' }, { status: 404 })

  try {
    const courseId = await enrollAndGenerate({
      topic: topic.name,
      topicId: topic.id,
      difficulty,
      ownerUserId: userId,
    })
    return json({ courseId })
  } catch (err) {
    // Missing key / generation failure — surface the message to the user.
    const message = err instanceof Error ? err.message : 'generation failed'
    return json({ error: message }, { status: 400 })
  }
}
