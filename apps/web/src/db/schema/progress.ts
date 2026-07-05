import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { achievements, topics } from './catalog'
import { courses, lessons, quizQuestions } from './content'

export const lessonStatus = pgEnum('lesson_status', [
  'not_started',
  'in_progress',
  'completed',
])
export const achievementStatus = pgEnum('achievement_status', [
  'locked',
  'in_progress',
  'earned',
])
export const dayStatus = pgEnum('day_status', ['completed', 'partial', 'missed'])
export const xpEventType = pgEnum('xp_event_type', [
  'lesson_completed',
  'quiz',
  'streak',
  'achievement',
  'session',
])

// Per-user topic enrollment + progress (Topics %, Current Focus).
export const userTopics = pgTable(
  'user_topics',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'cascade' }),
    difficulty: text('difficulty').notNull().default('beginner'),
    // The course track the user has chosen for this topic (a difficulty track or
    // a tailored course). Null ⇒ fall back to the newest visible course — keeps
    // pre-pointer users working. `set null` so deleting a course just reverts to
    // the fallback rather than orphaning the row.
    activeCourseId: text('active_course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),
    lessonsCompleted: integer('lessons_completed').notNull().default(0),
    progressPct: integer('progress_pct').notNull().default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('user_topics_user_topic_uq').on(t.userId, t.topicId)],
)

// Per-lesson progress (Recent Lessons scores, Next Up resume %).
export const userLessonProgress = pgTable(
  'user_lesson_progress',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: lessonStatus('status').notNull().default('not_started'),
    score: integer('score'),
    resumePct: integer('resume_pct').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('user_lesson_progress_uq').on(t.userId, t.lessonId)],
)

// Quiz answers (avg accuracy, quizzes taken, accuracy-over-time).
export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id')
    .notNull()
    .references(() => quizQuestions.id, { onDelete: 'cascade' }),
  selectedIndex: integer('selected_index'),
  answerText: text('answer_text'),
  isCorrect: boolean('is_correct').notNull(),
  aiFeedback: text('ai_feedback'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// One play↔learn session (Session history, focus score, hours played/learned).
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  playMinutes: integer('play_minutes').notNull().default(0),
  learnMinutes: integer('learn_minutes').notNull().default(0),
  focusScore: integer('focus_score'),
  lessonsCompleted: integer('lessons_completed').notNull().default(0),
  playIntervalMin: integer('play_interval_min'),
  learnIntervalMin: integer('learn_interval_min'),
  focusMode: boolean('focus_mode').notNull().default(false),
})

// The XP ledger — every grant. Total XP = sum, cached on users.xp.
export const xpEvents = pgTable('xp_events', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: xpEventType('type').notNull(),
  xp: integer('xp').notNull(),
  refType: text('ref_type'),
  refId: text('ref_id'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// One row per user per day — powers streak grids/calendars cheaply.
export const dailyActivity = pgTable(
  'daily_activity',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    status: dayStatus('status').notNull(),
    xpEarned: integer('xp_earned').notNull().default(0),
    minutesLearned: integer('minutes_learned').notNull().default(0),
    lessonsCompleted: integer('lessons_completed').notNull().default(0),
  },
  (t) => [uniqueIndex('daily_activity_user_date_uq').on(t.userId, t.date)],
)

// Earned/in-progress/locked achievements per user.
export const userAchievements = pgTable(
  'user_achievements',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    status: achievementStatus('status').notNull().default('locked'),
    progressCurrent: integer('progress_current').notNull().default(0),
    earnedAt: timestamp('earned_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('user_achievements_uq').on(t.userId, t.achievementId)],
)

// Skills radar (Progress/Stats). Derivable for v1; stored for hand-tuning.
export const userSkills = pgTable(
  'user_skills',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillKey: text('skill_key').notNull(),
    score: integer('score').notNull().default(0),
    baseline: integer('baseline').notNull().default(0),
  },
  (t) => [uniqueIndex('user_skills_uq').on(t.userId, t.skillKey)],
)
