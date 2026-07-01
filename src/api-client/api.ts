import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import {
  authResultSchema,
  enrollResultSchema,
  keyStatusSchema,
  meResultSchema,
  protectedResultSchema,
  totpSetupSchema,
  type EnrollResult,
  type KeyStatus,
  type PublicUser,
  type TotpSetup,
} from '@/core/schemas'
import type { Difficulty } from '@/core/generation'
import {
  achievementsViewSchema,
  dashboardSchema,
  progressViewSchema,
  statsViewSchema,
  topicsViewSchema,
  userSummarySchema,
  type AchievementsView,
  type Dashboard,
  type ProgressView,
  type StatsView,
  type TopicProgress,
  type UserSummary,
} from '@/core/app-data'
import {
  answerFeedbackSchema,
  lessonCompletionSchema,
  lessonViewSchema,
  type AnswerFeedback,
  type LessonCompletion,
  type LessonView,
} from '@/core/lesson-view'
import {
  reviewQueueSchema,
  reviewResultSchema,
  type ReviewQueue,
  type ReviewResult,
} from '@/core/review-view'
import type { Adapters } from './types'

// Surface-agnostic API. Construct it once with a surface's adapters
// (see ./index.ts for the web wiring). Responses are validated against the
// shared core schemas, so a malformed payload throws instead of leaking through.
export function createApi({ http, passkeys }: Adapters) {
  const auth = {
    async register(email: string, displayName: string): Promise<PublicUser> {
      const optionsJSON =
        await http.request<PublicKeyCredentialCreationOptionsJSON>(
          '/api/auth/register/options',
          { method: 'POST', body: JSON.stringify({ email, displayName }) },
        )
      const response = await passkeys.create(optionsJSON)
      const { user } = authResultSchema.parse(
        await http.request('/api/auth/register/verify', {
          method: 'POST',
          body: JSON.stringify({ email, response }),
        }),
      )
      return user
    },

    async login(email: string): Promise<PublicUser> {
      const optionsJSON =
        await http.request<PublicKeyCredentialRequestOptionsJSON>(
          '/api/auth/login/options',
          { method: 'POST', body: JSON.stringify({ email }) },
        )
      const response = await passkeys.get(optionsJSON)
      const { user } = authResultSchema.parse(
        await http.request('/api/auth/login/verify', {
          method: 'POST',
          body: JSON.stringify({ email, response }),
        }),
      )
      return user
    },

    async recover(email: string, token: string): Promise<PublicUser> {
      const { user } = authResultSchema.parse(
        await http.request('/api/auth/totp/recover', {
          method: 'POST',
          body: JSON.stringify({ email, token }),
        }),
      )
      return user
    },

    async logout(): Promise<void> {
      await http.request('/api/auth/logout', { method: 'POST' })
    },

    async me(): Promise<PublicUser | null> {
      try {
        return meResultSchema.parse(await http.request('/api/auth/me')).user
      } catch {
        return null
      }
    },
  }

  const totp = {
    async setup(): Promise<TotpSetup> {
      return totpSetupSchema.parse(
        await http.request('/api/auth/totp/setup', { method: 'POST' }),
      )
    },
    async enable(token: string): Promise<void> {
      await http.request('/api/auth/totp/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    },
    async disable(): Promise<void> {
      await http.request('/api/auth/totp/disable', { method: 'POST' })
    },
  }

  async function getProtected(): Promise<{ message: string }> {
    return protectedResultSchema.parse(await http.request('/api/protected'))
  }

  // The logged-in app's data reads. Each parses the response against the shared
  // core schema, so a malformed payload throws instead of leaking through.
  const data = {
    async summary(): Promise<UserSummary> {
      return userSummarySchema.parse(await http.request('/api/me/summary'))
    },
    async dashboard(): Promise<Dashboard> {
      return dashboardSchema.parse(await http.request('/api/me/dashboard'))
    },
    async topics(): Promise<TopicProgress[]> {
      return topicsViewSchema.parse(await http.request('/api/me/topics')).topics
    },
    async stats(): Promise<StatsView> {
      return statsViewSchema.parse(await http.request('/api/me/stats'))
    },
    async progress(): Promise<ProgressView> {
      return progressViewSchema.parse(await http.request('/api/me/progress'))
    },
    async achievements(): Promise<AchievementsView> {
      return achievementsViewSchema.parse(
        await http.request('/api/me/achievements'),
      )
    },
    async lesson(lessonId: string): Promise<LessonView> {
      return lessonViewSchema.parse(
        await http.request(`/api/me/lesson?id=${encodeURIComponent(lessonId)}`),
      )
    },
    async answer(
      questionId: string,
      selectedIndex: number,
    ): Promise<AnswerFeedback> {
      return answerFeedbackSchema.parse(
        await http.request('/api/me/answer', {
          method: 'POST',
          body: JSON.stringify({ questionId, selectedIndex }),
        }),
      )
    },
    async completeLesson(lessonId: string): Promise<LessonCompletion> {
      return lessonCompletionSchema.parse(
        await http.request('/api/me/complete', {
          method: 'POST',
          body: JSON.stringify({ lessonId }),
        }),
      )
    },
    async reviews(): Promise<ReviewQueue> {
      return reviewQueueSchema.parse(await http.request('/api/me/review'))
    },
    async gradeReview(
      cardId: string,
      selectedIndex: number,
    ): Promise<ReviewResult> {
      return reviewResultSchema.parse(
        await http.request('/api/me/review', {
          method: 'POST',
          body: JSON.stringify({ cardId, selectedIndex }),
        }),
      )
    },
  }

  // OpenAI key management. The key is write-only from the client's view —
  // status only ever reports whether one is on file.
  const integrations = {
    async keyStatus(): Promise<KeyStatus> {
      return keyStatusSchema.parse(await http.request('/api/me/openai-key'))
    },
    async saveOpenAiKey(apiKey: string): Promise<KeyStatus> {
      return keyStatusSchema.parse(
        await http.request('/api/me/openai-key', {
          method: 'POST',
          body: JSON.stringify({ apiKey }),
        }),
      )
    },
  }

  const courses = {
    async enroll(
      topicSlug: string,
      difficulty: Difficulty,
    ): Promise<EnrollResult> {
      return enrollResultSchema.parse(
        await http.request('/api/me/enroll', {
          method: 'POST',
          body: JSON.stringify({ topicSlug, difficulty }),
        }),
      )
    },
  }

  return { auth, totp, getProtected, data, integrations, courses }
}

export type Api = ReturnType<typeof createApi>
