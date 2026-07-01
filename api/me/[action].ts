import { eq } from 'drizzle-orm'
import {
  answerRequestSchema,
  completeRequestSchema,
} from '../../src/core/lesson-view'
import { reviewGradeRequestSchema } from '../../src/core/review-view'
import { enrollRequest, openAiKeyRequest } from '../../src/core/schemas'
import { db } from '../../src/db'
import { topics } from '../../src/db/schema'
import {
  getAchievementsView,
  getActivity,
  getStats,
  getTopicsView,
  getUserSummary,
} from '../../src/server/app-data'
import { enrollAndGenerate } from '../../src/server/enroll'
import {
  hasOpenAiKey,
  saveOpenAiKey,
} from '../../src/server/provider-credentials'
import {
  completeLesson,
  getLessonView,
  submitAnswer,
} from '../../src/server/learning'
import { getDueReviews, gradeReview } from '../../src/server/review'
import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { parseBody } from '../_lib/validate'

// All /api/me/* routes are served by this one function (Vercel counts each
// file as a Serverless Function; the Hobby plan caps at 12). It dispatches on
// the last path segment + method — the URLs stay `/api/me/<action>`.
function action(req: Request): string {
  return new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? ''
}

export async function GET(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  switch (action(req)) {
    case 'summary':
      return json(await getUserSummary(userId))

    case 'topics':
      return json({ topics: await getTopicsView(userId) })

    case 'achievements':
      return json(await getAchievementsView(userId))

    case 'openai-key':
      return json({ hasKey: await hasOpenAiKey(userId) })

    case 'stats': {
      const [stats, topicsView] = await Promise.all([
        getStats(userId),
        getTopicsView(userId),
      ])
      return json({ stats, topics: topicsView })
    }

    case 'progress': {
      const [stats, topicsView, activity] = await Promise.all([
        getStats(userId),
        getTopicsView(userId),
        getActivity(userId),
      ])
      return json({
        stats,
        topics: topicsView,
        skills: activity.skills,
        activity: activity.activity,
      })
    }

    case 'dashboard': {
      const [user, stats, topicsView, activity] = await Promise.all([
        getUserSummary(userId),
        getStats(userId),
        getTopicsView(userId),
        getActivity(userId),
      ])
      return json({
        user,
        stats,
        focus: topicsView.slice(0, 3),
        recentLessons: activity.recentLessons,
        weekActivity: activity.weekActivity,
      })
    }

    case 'lesson': {
      const id = new URL(req.url).searchParams.get('id')
      if (!id) return json({ error: 'missing lesson id' }, { status: 400 })
      const lesson = await getLessonView(id)
      if (!lesson) return json({ error: 'lesson not found' }, { status: 404 })
      return json(lesson)
    }

    case 'review':
      return json(await getDueReviews(userId))

    default:
      return json({ error: 'not found' }, { status: 404 })
  }
}

export async function POST(req: Request): Promise<Response> {
  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  switch (action(req)) {
    case 'openai-key': {
      const parsed = await parseBody(openAiKeyRequest, req)
      if (!parsed.ok) return parsed.response
      await saveOpenAiKey(userId, parsed.data.apiKey)
      return json({ hasKey: true })
    }

    case 'enroll': {
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
        const message = err instanceof Error ? err.message : 'generation failed'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'answer': {
      const parsed = await parseBody(answerRequestSchema, req)
      if (!parsed.ok) return parsed.response
      const feedback = await submitAnswer(
        userId,
        parsed.data.questionId,
        parsed.data.selectedIndex,
      )
      if (!feedback) return json({ error: 'question not found' }, { status: 404 })
      return json(feedback)
    }

    case 'complete': {
      const parsed = await parseBody(completeRequestSchema, req)
      if (!parsed.ok) return parsed.response
      const result = await completeLesson(userId, parsed.data.lessonId)
      if (!result) return json({ error: 'lesson not found' }, { status: 404 })
      return json(result)
    }

    case 'review': {
      const parsed = await parseBody(reviewGradeRequestSchema, req)
      if (!parsed.ok) return parsed.response
      const result = await gradeReview(
        userId,
        parsed.data.cardId,
        parsed.data.selectedIndex,
      )
      if (!result) return json({ error: 'review not found' }, { status: 404 })
      return json(result)
    }

    default:
      return json({ error: 'not found' }, { status: 404 })
  }
}
