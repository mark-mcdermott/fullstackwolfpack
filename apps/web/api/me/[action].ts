import { eq } from 'drizzle-orm'
import {
  answerRequestSchema,
  completeRequestSchema,
} from '../../src/core/lesson-view'
import { can } from '../../src/core/access'
import { reviewGradeRequestSchema } from '../../src/core/review-view'
import { tutorRequestSchema } from '../../src/core/tutor'
import { playtimeRecordRequest } from '../../src/core/playtime'
import { leaderboardOptInRequest } from '../../src/core/leaderboard'
import {
  friendRequestBody,
  friendRespondBody,
  sendMessageBody,
} from '../../src/core/social'
import {
  adminUpdateRequest,
  anthropicKeyRequest,
  enrollRequest,
  focusSessionRequest,
  openAiKeyRequest,
  resetTopicRequest,
  setDifficultyRequest,
  tailorRequest,
  userPreferencesPatch,
} from '../../src/core/schemas'
import { db } from '../../src/db'
import { topics, users } from '../../src/db/schema'
import {
  getAchievementsView,
  getActivity,
  getAdminUsers,
  getSeries,
  getStats,
  getTopicsView,
  getUserSummary,
  updateUserAccess,
} from '../../src/server/app-data'
import {
  BillingNotConfiguredError,
  createBillingPortalUrl,
  createCheckoutUrl,
  handleStripeWebhook,
} from '../../src/server/billing'
import { enrollAndGenerate } from '../../src/server/enroll'
import { recordFocusSession } from '../../src/server/focus'
import { getPlaytime, recordPlaytime } from '../../src/server/playtime'
import {
  getLeaderboard,
  getPublicLeaderboard,
  setLeaderboardOptIn,
} from '../../src/server/leaderboard'
import { getGenerationEta } from '../../src/server/generation-timing'
import {
  getConversation,
  getFriendsView,
  respondToRequest,
  searchUsers,
  sendFriendRequest,
  sendMessage,
  touchPresence,
} from '../../src/server/social'
import {
  createUserTokenRequest,
  isRealtimeEnabled,
  publishToUser,
} from '../../src/server/realtime'
import {
  getPublicCourseOutline,
  getPublicLessonView,
  getPublicTopics,
  gradeQuestionPublic,
} from '../../src/server/public-learning'
import {
  hasOpenAiKey,
  saveOpenAiKey,
} from '../../src/server/provider-credentials'
import { hasProviderKey, saveProviderKey } from '../../src/server/provider'
import {
  completeLesson,
  getCourseOutline,
  getLessonView,
  importGuestProgress,
  resetTopicProgress,
  submitAnswer,
} from '../../src/server/learning'
import { importProgressRequest } from '../../src/core/public-content'
import { getAdaptiveState } from '../../src/server/adaptive'
import { getTopicTracks, setActiveDifficulty } from '../../src/server/tracks'
import { tailorCourse } from '../../src/server/tailor'
import { getPreferences, savePreferences } from '../../src/server/preferences'
import { generateDiagnostic } from '../../src/server/diagnostic'
import { runTutor } from '../../src/server/tutor'
import { getDueReviews, gradeReview } from '../../src/server/review'
import { json } from '../_lib/http'
import { getSessionUserId } from '../_lib/session'
import { parseBody } from '../_lib/validate'
import { devBecome } from '../_lib/dev-users'

// All /api/me/* routes are served by this one function (Vercel counts each
// file as a Serverless Function; the Hobby plan caps at 12). It dispatches on
// the last path segment + method — the URLs stay `/api/me/<action>`.
function action(req: Request): string {
  return new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? ''
}

// The server-side admin boundary (client route guards are UX only).
async function requireAdmin(userId: string): Promise<Response | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user || !can(user, 'admin.access')) {
    return json({ error: 'forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(req: Request): Promise<Response> {
  // Public (guest) reads over built-in content — served before the session gate.
  switch (action(req)) {
    case 'public-topics':
      return json({ topics: await getPublicTopics() })
    case 'public-course': {
      const topic = new URL(req.url).searchParams.get('topic')
      if (!topic) return json({ error: 'missing topic' }, { status: 400 })
      const outline = await getPublicCourseOutline(topic)
      return outline ? json(outline) : json({ error: 'not found' }, { status: 404 })
    }
    case 'public-lesson': {
      const id = new URL(req.url).searchParams.get('id')
      if (!id) return json({ error: 'missing id' }, { status: 400 })
      const view = await getPublicLessonView(id)
      return view ? json(view) : json({ error: 'not found' }, { status: 404 })
    }
    case 'public-leaderboard':
      return json(await getPublicLeaderboard())
  }

  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  switch (action(req)) {
    case 'summary':
      return json(await getUserSummary(userId))

    case 'topics':
      return json({ topics: await getTopicsView(userId) })

    case 'achievements':
      return json(await getAchievementsView(userId))

    case 'series':
      return json(await getSeries(userId))

    case 'friends':
      return json(await getFriendsView(userId))

    case 'find-users': {
      const q = new URL(req.url).searchParams.get('q') ?? ''
      return json(await searchUsers(userId, q))
    }

    case 'messages': {
      const withUserId = new URL(req.url).searchParams.get('with')
      if (!withUserId) return json({ error: 'missing with' }, { status: 400 })
      return json(await getConversation(userId, withUserId))
    }

    case 'ably-token':
      if (!isRealtimeEnabled()) return json({ enabled: false })
      return json({
        enabled: true,
        tokenRequest: await createUserTokenRequest(userId),
      })

    case 'generation-eta':
      return json(await getGenerationEta())

    case 'preferences':
      return json(await getPreferences(userId))

    case 'diagnostic': {
      const slug = new URL(req.url).searchParams.get('topic')
      if (!slug) return json({ error: 'missing topic' }, { status: 400 })
      const topic = await db.query.topics.findFirst({
        where: eq(topics.slug, slug),
      })
      if (!topic) return json({ error: 'unknown topic' }, { status: 404 })
      try {
        return json(await generateDiagnostic(userId, topic.name))
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'could not build a diagnostic'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'openai-key':
      return json({ hasKey: await hasOpenAiKey(userId) })

    case 'anthropic-key':
      return json({ hasKey: await hasProviderKey(userId, 'anthropic') })

    case 'adaptive': {
      const topic = new URL(req.url).searchParams.get('topic') ?? undefined
      return json(await getAdaptiveState(userId, topic))
    }

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

    case 'course': {
      const topic = new URL(req.url).searchParams.get('topic')
      if (!topic) return json({ error: 'missing topic' }, { status: 400 })
      const outline = await getCourseOutline(userId, topic)
      if (!outline) return json({ error: 'no course for topic' }, { status: 404 })
      return json(outline)
    }

    case 'topic-tracks': {
      const topic = new URL(req.url).searchParams.get('topic')
      if (!topic) return json({ error: 'missing topic' }, { status: 400 })
      const tracks = await getTopicTracks(userId, topic)
      if (!tracks) return json({ error: 'unknown topic' }, { status: 404 })
      return json(tracks)
    }

    case 'review':
      return json(await getDueReviews(userId))

    case 'playtime':
      return json({ playtime: await getPlaytime(userId) })

    case 'leaderboard':
      return json(await getLeaderboard(userId))

    case 'admin-users': {
      const forbidden = await requireAdmin(userId)
      if (forbidden) return forbidden
      return json({ users: await getAdminUsers() })
    }

    default:
      return json({ error: 'not found' }, { status: 404 })
  }
}

// Stripe webhook: unauthenticated (Stripe isn't a logged-in user) and needs the
// raw body for signature verification, so it runs before the session gate and
// reads `req.text()` instead of parsing JSON.
async function stripeWebhook(req: Request): Promise<Response> {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return json({ error: 'missing signature' }, { status: 400 })
  try {
    await handleStripeWebhook(await req.text(), signature)
    return json({ received: true })
  } catch (err) {
    if (err instanceof BillingNotConfiguredError) {
      return json({ error: err.message }, { status: 503 })
    }
    // Bad signature → 400 (forged/misconfigured, don't retry). Anything else is
    // treated as transient → 500 so Stripe retries.
    const badSignature =
      err instanceof Error && err.name === 'StripeSignatureVerificationError'
    const message = err instanceof Error ? err.message : 'webhook error'
    return json({ error: message }, { status: badSignature ? 400 : 500 })
  }
}

export async function POST(req: Request): Promise<Response> {
  // Dev Mode role switcher (off unless VITE_ENABLE_DEV_MODE=1). Unauthenticated
  // — it mints the session — so it runs before the auth gate below.
  if (action(req) === 'become') return devBecome(req)
  // Stripe webhook is also unauthenticated + raw-body (see above).
  if (action(req) === 'stripe-webhook') return stripeWebhook(req)

  // Public (guest) MCQ grading over built-in content — before the session gate.
  if (action(req) === 'public-grade') {
    const parsed = await parseBody(answerRequestSchema, req)
    if (!parsed.ok) return parsed.response
    const fb = await gradeQuestionPublic(parsed.data.questionId, parsed.data)
    return fb ? json(fb) : json({ error: 'not found' }, { status: 404 })
  }

  const userId = await getSessionUserId(req)
  if (!userId) return json({ error: 'unauthorized' }, { status: 401 })

  switch (action(req)) {
    case 'openai-key': {
      const parsed = await parseBody(openAiKeyRequest, req)
      if (!parsed.ok) return parsed.response
      await saveOpenAiKey(userId, parsed.data.apiKey)
      return json({ hasKey: true })
    }

    case 'anthropic-key': {
      const parsed = await parseBody(anthropicKeyRequest, req)
      if (!parsed.ok) return parsed.response
      await saveProviderKey(userId, 'anthropic', parsed.data.apiKey)
      return json({ hasKey: true })
    }

    case 'preferences': {
      const parsed = await parseBody(userPreferencesPatch, req)
      if (!parsed.ok) return parsed.response
      return json(await savePreferences(userId, parsed.data))
    }

    case 'heartbeat':
      await touchPresence(userId)
      return json({ ok: true })

    case 'import-progress': {
      const parsed = await parseBody(importProgressRequest, req)
      if (!parsed.ok) return parsed.response
      return json(
        await importGuestProgress(
          userId,
          parsed.data.entries,
          parsed.data.playXp,
        ),
      )
    }

    case 'friend-request': {
      const parsed = await parseBody(friendRequestBody, req)
      if (!parsed.ok) return parsed.response
      try {
        return json(await sendFriendRequest(userId, parsed.data.toUserId))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'request failed'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'friend-respond': {
      const parsed = await parseBody(friendRespondBody, req)
      if (!parsed.ok) return parsed.response
      try {
        return json(
          await respondToRequest(userId, parsed.data.requestId, parsed.data.action),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'request failed'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'send-message': {
      const parsed = await parseBody(sendMessageBody, req)
      if (!parsed.ok) return parsed.response
      try {
        const result = await sendMessage(
          userId,
          parsed.data.toUserId,
          parsed.data.body,
        )
        // Realtime push (fire-and-forget): notify the recipient, and the
        // sender's other devices. Each event names the *other* party in the
        // affected conversation.
        void publishToUser(parsed.data.toUserId, {
          type: 'message',
          fromUserId: userId,
        })
        void publishToUser(userId, {
          type: 'message',
          fromUserId: parsed.data.toUserId,
        })
        return json(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'request failed'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'enroll': {
      const parsed = await parseBody(enrollRequest, req)
      if (!parsed.ok) return parsed.response
      const { topicSlug, difficulty, customization } = parsed.data

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
          customization,
        })
        return json({ courseId })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'generation failed'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'checkout': {
      try {
        return json({ url: await createCheckoutUrl(userId) })
      } catch (err) {
        if (err instanceof BillingNotConfiguredError) {
          return json({ error: err.message }, { status: 503 })
        }
        const message = err instanceof Error ? err.message : 'checkout failed'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'billing-portal': {
      try {
        return json({ url: await createBillingPortalUrl(userId) })
      } catch (err) {
        if (err instanceof BillingNotConfiguredError) {
          return json({ error: err.message }, { status: 503 })
        }
        const message =
          err instanceof Error ? err.message : 'could not open billing portal'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'focus-session': {
      const parsed = await parseBody(focusSessionRequest, req)
      if (!parsed.ok) return parsed.response
      return json(await recordFocusSession(userId, parsed.data))
    }

    case 'playtime': {
      const parsed = await parseBody(playtimeRecordRequest, req)
      if (!parsed.ok) return parsed.response
      return json(await recordPlaytime(userId, parsed.data))
    }

    case 'leaderboard': {
      const parsed = await parseBody(leaderboardOptInRequest, req)
      if (!parsed.ok) return parsed.response
      return json(await setLeaderboardOptIn(userId, parsed.data.optIn))
    }

    case 'answer': {
      const parsed = await parseBody(answerRequestSchema, req)
      if (!parsed.ok) return parsed.response
      const feedback = await submitAnswer(userId, parsed.data.questionId, {
        selectedIndex: parsed.data.selectedIndex,
        answerText: parsed.data.answerText,
      })
      if (!feedback) return json({ error: 'question not found' }, { status: 404 })
      return json(feedback)
    }

    case 'tutor': {
      // Pro-gated: the AI tutor is a paid feature (the real server-side boundary).
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
      if (!user || !can(user, 'feature.ai_tutor')) {
        return json({ error: 'Upgrade to Pro to use the AI tutor.' }, { status: 403 })
      }
      const parsed = await parseBody(tutorRequestSchema, req)
      if (!parsed.ok) return parsed.response
      const result = await runTutor(userId, {
        segmentId: parsed.data.segmentId,
        messages: parsed.data.messages,
        mode: parsed.data.mode,
      })
      if ('error' in result) {
        return json({ error: result.error }, { status: result.status })
      }
      return json(result)
    }

    case 'complete': {
      const parsed = await parseBody(completeRequestSchema, req)
      if (!parsed.ok) return parsed.response
      const result = await completeLesson(userId, parsed.data.lessonId)
      if (!result) return json({ error: 'lesson not found' }, { status: 404 })
      return json(result)
    }

    case 'reset-topic': {
      const parsed = await parseBody(resetTopicRequest, req)
      if (!parsed.ok) return parsed.response
      const ok = await resetTopicProgress(userId, parsed.data.topicSlug)
      if (!ok) return json({ error: 'unknown topic' }, { status: 404 })
      return json({ ok: true })
    }

    case 'set-difficulty': {
      const parsed = await parseBody(setDifficultyRequest, req)
      if (!parsed.ok) return parsed.response
      try {
        const result = await setActiveDifficulty(
          userId,
          parsed.data.topicSlug,
          parsed.data.difficulty,
        )
        if (!result) return json({ error: 'unknown topic' }, { status: 404 })
        return json(result)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'could not switch difficulty'
        return json({ error: message }, { status: 400 })
      }
    }

    case 'tailor-course': {
      const parsed = await parseBody(tailorRequest, req)
      if (!parsed.ok) return parsed.response
      try {
        const result = await tailorCourse(
          userId,
          parsed.data.topicSlug,
          parsed.data.mode,
          parsed.data.instructions,
        )
        if (!result) return json({ error: 'unknown topic' }, { status: 404 })
        return json(result)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'could not tailor course'
        return json({ error: message }, { status: 400 })
      }
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

    case 'admin-users': {
      const forbidden = await requireAdmin(userId)
      if (forbidden) return forbidden
      const parsed = await parseBody(adminUpdateRequest, req)
      if (!parsed.ok) return parsed.response
      await updateUserAccess(parsed.data.userId, {
        role: parsed.data.role,
        tier: parsed.data.tier,
      })
      return json({ ok: true })
    }

    default:
      return json({ error: 'not found' }, { status: 404 })
  }
}
