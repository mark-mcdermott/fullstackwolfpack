import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import {
  authResultSchema,
  billingRedirectSchema,
  enrollResultSchema,
  focusSessionResultSchema,
  generationEtaSchema,
  keyStatusSchema,
  meResultSchema,
  protectedResultSchema,
  resetTopicResultSchema,
  setDifficultyResultSchema,
  tailorResultSchema,
  topicTracksSchema,
  totpSetupSchema,
  userPreferencesSchema,
  type BillingRedirect,
  type EnrollResult,
  type FocusSessionInput,
  type FocusSessionResult,
  type GenerationEta,
  type KeyStatus,
  type PublicUser,
  type SetDifficultyResult,
  type TailorMode,
  type TailorResult,
  type TopicTracks,
  type TotpSetup,
  type UserPreferences,
} from '@/core/schemas'
import type { Difficulty } from '@/core/generation'
import {
  type GamePlaytime,
  type PlaytimeRecordInput,
  playtimeListSchema,
  playtimeRecordResultSchema,
} from '@/core/playtime'
import {
  type LeaderboardView,
  leaderboardViewSchema,
} from '@/core/leaderboard'
import {
  ablyTokenSchema,
  conversationSchema,
  friendsViewSchema,
  userSearchViewSchema,
  type AblyTokenResponse,
  type Conversation,
  type FriendsView,
  type UserSearchView,
} from '@/core/social'
import {
  achievementsViewSchema,
  adminUsersSchema,
  courseOutlineSchema,
  dashboardSchema,
  progressViewSchema,
  seriesSchema,
  statsViewSchema,
  topicsViewSchema,
  userSummarySchema,
  type AchievementsView,
  type AdminUser,
  type CourseOutline,
  type Dashboard,
  type ProgressView,
  type Series,
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
import {
  tutorReplySchema,
  type TutorMessage,
  type TutorMode,
  type TutorReply,
} from '@/core/tutor'
import { adaptiveStateSchema, type AdaptiveState } from '@/core/adaptive'
import { diagnosticSchema, type Diagnostic } from '@/core/diagnostic'
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
    async series(): Promise<Series> {
      return seriesSchema.parse(await http.request('/api/me/series'))
    },
    async lesson(lessonId: string): Promise<LessonView> {
      return lessonViewSchema.parse(
        await http.request(`/api/me/lesson?id=${encodeURIComponent(lessonId)}`),
      )
    },
    async course(topicSlug: string): Promise<CourseOutline> {
      return courseOutlineSchema.parse(
        await http.request(
          `/api/me/course?topic=${encodeURIComponent(topicSlug)}`,
        ),
      )
    },
    async answer(
      questionId: string,
      input: { selectedIndex?: number; answerText?: string },
    ): Promise<AnswerFeedback> {
      return answerFeedbackSchema.parse(
        await http.request('/api/me/answer', {
          method: 'POST',
          body: JSON.stringify({ questionId, ...input }),
        }),
      )
    },
    async tutor(
      segmentId: string,
      messages: TutorMessage[],
      mode: TutorMode,
    ): Promise<TutorReply> {
      return tutorReplySchema.parse(
        await http.request('/api/me/tutor', {
          method: 'POST',
          body: JSON.stringify({ segmentId, messages, mode }),
        }),
      )
    },
    async adaptive(topicSlug?: string): Promise<AdaptiveState> {
      const q = topicSlug ? `?topic=${encodeURIComponent(topicSlug)}` : ''
      return adaptiveStateSchema.parse(await http.request(`/api/me/adaptive${q}`))
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
    async anthropicKeyStatus(): Promise<KeyStatus> {
      return keyStatusSchema.parse(await http.request('/api/me/anthropic-key'))
    },
    async saveAnthropicKey(apiKey: string): Promise<KeyStatus> {
      return keyStatusSchema.parse(
        await http.request('/api/me/anthropic-key', {
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
      customization?: string,
    ): Promise<EnrollResult> {
      return enrollResultSchema.parse(
        await http.request('/api/me/enroll', {
          method: 'POST',
          body: JSON.stringify({ topicSlug, difficulty, customization }),
        }),
      )
    },
    // A short AI placement quiz for the pre-generation intake (skill-level pref).
    async diagnostic(topicSlug: string): Promise<Diagnostic> {
      return diagnosticSchema.parse(
        await http.request(
          `/api/me/diagnostic?topic=${encodeURIComponent(topicSlug)}`,
        ),
      )
    },
    // Reset the user's progress for a topic back to zero (keeps XP/streak).
    async resetTopic(topicSlug: string): Promise<void> {
      resetTopicResultSchema.parse(
        await http.request('/api/me/reset-topic', {
          method: 'POST',
          body: JSON.stringify({ topicSlug }),
        }),
      )
    },
    // The topic's difficulty tracks: which levels have a course + which is active.
    async tracks(topicSlug: string): Promise<TopicTracks> {
      return topicTracksSchema.parse(
        await http.request(
          `/api/me/topic-tracks?topic=${encodeURIComponent(topicSlug)}`,
        ),
      )
    },
    // Switch the active difficulty (generates the track if it doesn't exist yet).
    async setDifficulty(
      topicSlug: string,
      difficulty: Difficulty,
    ): Promise<SetDifficultyResult> {
      return setDifficultyResultSchema.parse(
        await http.request('/api/me/set-difficulty', {
          method: 'POST',
          body: JSON.stringify({ topicSlug, difficulty }),
        }),
      )
    },
    // Tailor the active course from a free-text instruction: append lessons or
    // rebuild it. Both regenerate content (~20s).
    async tailor(
      topicSlug: string,
      mode: TailorMode,
      instructions: string,
    ): Promise<TailorResult> {
      return tailorResultSchema.parse(
        await http.request('/api/me/tailor-course', {
          method: 'POST',
          body: JSON.stringify({ topicSlug, mode, instructions }),
        }),
      )
    },
    // Expected generation duration (ms) for the progress bar's ETA.
    async generationEta(): Promise<GenerationEta> {
      return generationEtaSchema.parse(
        await http.request('/api/me/generation-eta'),
      )
    },
  }

  // Global lesson preferences (Settings → Lesson preferences).
  const preferences = {
    async get(): Promise<UserPreferences> {
      return userPreferencesSchema.parse(
        await http.request('/api/me/preferences'),
      )
    },
    async save(patch: Partial<UserPreferences>): Promise<UserPreferences> {
      return userPreferencesSchema.parse(
        await http.request('/api/me/preferences', {
          method: 'POST',
          body: JSON.stringify(patch),
        }),
      )
    },
  }

  // Focus sessions (timed play/learn cycles). Returns the XP granted.
  const focus = {
    async record(input: FocusSessionInput): Promise<FocusSessionResult> {
      return focusSessionResultSchema.parse(
        await http.request('/api/me/focus-session', {
          method: 'POST',
          body: JSON.stringify(input),
        }),
      )
    },
  }

  // Arcade playtime telemetry — per-title minutes, flushed from the player as
  // the user plays and read back to light up the gallery.
  const arcade = {
    async playtime(): Promise<GamePlaytime[]> {
      return playtimeListSchema.parse(await http.request('/api/me/playtime'))
        .playtime
    },
    async recordPlaytime(
      input: PlaytimeRecordInput,
    ): Promise<{ seconds: number }> {
      return playtimeRecordResultSchema.parse(
        await http.request('/api/me/playtime', {
          method: 'POST',
          body: JSON.stringify(input),
        }),
      )
    },
  }

  // Global leaderboard — an opt-in public XP ranking.
  const leaderboard = {
    async get(): Promise<LeaderboardView> {
      return leaderboardViewSchema.parse(
        await http.request('/api/me/leaderboard'),
      )
    },
    async setOptIn(optIn: boolean): Promise<LeaderboardView> {
      return leaderboardViewSchema.parse(
        await http.request('/api/me/leaderboard', {
          method: 'POST',
          body: JSON.stringify({ optIn }),
        }),
      )
    },
  }

  // Stripe billing. Each returns a hosted URL the caller redirects to.
  const billing = {
    async checkout(): Promise<BillingRedirect> {
      return billingRedirectSchema.parse(
        await http.request('/api/me/checkout', { method: 'POST' }),
      )
    },
    async portal(): Promise<BillingRedirect> {
      return billingRedirectSchema.parse(
        await http.request('/api/me/billing-portal', { method: 'POST' }),
      )
    },
  }

  // Admin-only (server enforces admin.access; this just reads/writes).
  const admin = {
    async users(): Promise<AdminUser[]> {
      return adminUsersSchema.parse(await http.request('/api/me/admin-users'))
        .users
    },
    async updateUser(
      userId: string,
      patch: { role?: 'user' | 'admin'; tier?: 'free' | 'pro' },
    ): Promise<void> {
      await http.request('/api/me/admin-users', {
        method: 'POST',
        body: JSON.stringify({ userId, ...patch }),
      })
    },
  }

  // Community: friends + DMs + presence. All poll-based (no realtime service).
  const social = {
    async friends(): Promise<FriendsView> {
      return friendsViewSchema.parse(await http.request('/api/me/friends'))
    },
    async findUsers(q: string): Promise<UserSearchView> {
      return userSearchViewSchema.parse(
        await http.request(`/api/me/find-users?q=${encodeURIComponent(q)}`),
      )
    },
    async conversation(withUserId: string): Promise<Conversation> {
      return conversationSchema.parse(
        await http.request(`/api/me/messages?with=${encodeURIComponent(withUserId)}`),
      )
    },
    async requestFriend(toUserId: string): Promise<void> {
      await http.request('/api/me/friend-request', {
        method: 'POST',
        body: JSON.stringify({ toUserId }),
      })
    },
    async respondFriend(
      requestId: string,
      action: 'accept' | 'decline',
    ): Promise<void> {
      await http.request('/api/me/friend-respond', {
        method: 'POST',
        body: JSON.stringify({ requestId, action }),
      })
    },
    async sendMessage(toUserId: string, body: string): Promise<void> {
      await http.request('/api/me/send-message', {
        method: 'POST',
        body: JSON.stringify({ toUserId, body }),
      })
    },
    async heartbeat(): Promise<void> {
      await http.request('/api/me/heartbeat', { method: 'POST', body: '{}' })
    },
    async ablyToken(): Promise<AblyTokenResponse> {
      return ablyTokenSchema.parse(await http.request('/api/me/ably-token'))
    },
  }

  return {
    auth,
    totp,
    getProtected,
    data,
    integrations,
    courses,
    preferences,
    focus,
    arcade,
    leaderboard,
    billing,
    admin,
    social,
  }
}

export type Api = ReturnType<typeof createApi>
