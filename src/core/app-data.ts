import { z } from 'zod'

// The logged-in app's data contract — pure zod, shared by the server functions
// in `api/` (which validate on the way out) and the api-client (which parses on
// the way in), so client and server can never disagree about a shape.

export const userSummarySchema = z.object({
  displayName: z.string(),
  level: z.number().int(),
  xp: z.number().int(),
  xpToNext: z.number().int(), // XP remaining until the next level (0 at max)
  levelPct: z.number().int(), // progress within the current level, 0–100
})
export type UserSummary = z.infer<typeof userSummarySchema>

export const statsSchema = z.object({
  streak: z.number().int(),
  bestStreak: z.number().int(),
  accuracy: z.number().int(), // average quiz accuracy, 0–100
  hoursLearned: z.number().int(),
  hoursPlayed: z.number().int(),
  lessonsCompleted: z.number().int(),
  sessions: z.number().int(),
  totalXp: z.number().int(),
})
export type Stats = z.infer<typeof statsSchema>

export const topicProgressSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  difficulty: z.string(),
  pct: z.number().int(), // 0–100
  lessonsCompleted: z.number().int(),
  lessonsTotal: z.number().int(),
})
export type TopicProgress = z.infer<typeof topicProgressSchema>

export const recentLessonSchema = z.object({
  lessonId: z.string().nullable(), // null only for legacy rows; drives deep-links
  title: z.string(),
  topic: z.string(),
  minutes: z.number().int(),
  score: z.number().int().nullable(),
  status: z.string(),
})
export type RecentLesson = z.infer<typeof recentLessonSchema>

// A generated course for a topic, with per-lesson progress for the current user.
export const courseLessonSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  orderIndex: z.number().int(),
  estMinutes: z.number().int(),
  status: z.string(),
})
export const courseOutlineSchema = z.object({
  courseId: z.string(),
  topicSlug: z.string(),
  status: z.string(),
  lessons: z.array(courseLessonSchema),
  nextLessonId: z.string().nullable(), // first not-completed lesson (or first, for review)
})
export type CourseOutline = z.infer<typeof courseOutlineSchema>

export const activityItemSchema = z.object({
  title: z.string(),
  topic: z.string(),
  at: z.string(), // ISO timestamp; formatted client-side via relativeTime
  xp: z.number().int(),
})
export type ActivityItem = z.infer<typeof activityItemSchema>

export const skillSchema = z.object({
  key: z.string(),
  value: z.number().int(), // 0–100
})
export type Skill = z.infer<typeof skillSchema>

export const achievementItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  current: z.number().int(),
  target: z.number().int(),
  earnedAt: z.string().nullable(), // ISO date, or null when not earned
})
export type AchievementItem = z.infer<typeof achievementItemSchema>

export const achievementsViewSchema = z.object({
  earned: z.array(achievementItemSchema),
  inProgress: z.array(achievementItemSchema),
  locked: z.array(achievementItemSchema),
})
export type AchievementsView = z.infer<typeof achievementsViewSchema>

// ---- Endpoint payloads ----

export const dashboardSchema = z.object({
  user: userSummarySchema,
  stats: statsSchema,
  focus: z.array(topicProgressSchema),
  recentLessons: z.array(recentLessonSchema),
  weekActivity: z.array(z.string()),
})
export type Dashboard = z.infer<typeof dashboardSchema>

export const topicsViewSchema = z.object({ topics: z.array(topicProgressSchema) })

export const statsViewSchema = z.object({
  stats: statsSchema,
  topics: z.array(topicProgressSchema),
})
export type StatsView = z.infer<typeof statsViewSchema>

export const progressViewSchema = z.object({
  stats: statsSchema,
  topics: z.array(topicProgressSchema),
  skills: z.array(skillSchema),
  activity: z.array(activityItemSchema),
})
export type ProgressView = z.infer<typeof progressViewSchema>
