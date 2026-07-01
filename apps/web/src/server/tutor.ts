import process from 'node:process'
import { eq } from 'drizzle-orm'
import {
  buildTutorSystemPrompt,
  type TutorContext,
  type TutorMessage,
  type TutorMode,
} from '../core/tutor'
import { db } from '../db'
import { courses, lessons, lessonSegments, topics } from '../db/schema'
import { anthropicComplete, openAiComplete } from './llm'
import { resolveProvider } from './provider'

// Server-side AI tutor: load the on-screen segment (so grounding can't be spoofed
// by the client), build the grounded system prompt, and call the provider.
// Model per docs/education-system.md §5.5: Sonnet 5 (interactive quality/latency).

// Load the lesson context a segment belongs to. null → the segment doesn't exist.
async function loadContext(segmentId: string): Promise<TutorContext | null> {
  const [row] = await db
    .select({
      topic: topics.name,
      lessonTitle: lessons.title,
      segmentTitle: lessonSegments.title,
      content: lessonSegments.content,
    })
    .from(lessonSegments)
    .innerJoin(lessons, eq(lessons.id, lessonSegments.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(topics, eq(topics.id, courses.topicId))
    .where(eq(lessonSegments.id, segmentId))
  if (!row) return null
  return {
    topic: row.topic,
    lessonTitle: row.lessonTitle,
    segmentTitle: row.segmentTitle,
    segmentMarkdown: (row.content as { markdown?: string } | null)?.markdown ?? '',
  }
}

export type TutorResult = { reply: string } | { error: string; status: number }

export async function runTutor(
  userId: string,
  args: { segmentId: string; messages: TutorMessage[]; mode: TutorMode },
): Promise<TutorResult> {
  const context = await loadContext(args.segmentId)
  if (!context) return { error: 'segment not found', status: 404 }

  const provider = await resolveProvider(userId)
  if (!provider) {
    return {
      error: 'Add an Anthropic or OpenAI key in Settings to use the tutor.',
      status: 400,
    }
  }

  const system = buildTutorSystemPrompt(context, args.mode)
  try {
    const reply =
      provider.provider === 'anthropic'
        ? await anthropicComplete(provider.apiKey, {
            model: process.env.ANTHROPIC_TUTOR_MODEL ?? 'claude-sonnet-5',
            system,
            messages: args.messages,
            maxTokens: 700,
            disableThinking: true, // snappy, non-streaming interactive replies
          })
        : await openAiComplete(provider.apiKey, {
            model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
            system,
            messages: args.messages,
            maxTokens: 700,
          })
    return { reply }
  } catch {
    return { error: 'The tutor is unavailable right now — try again.', status: 502 }
  }
}
