import { sql } from 'drizzle-orm'
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { topics } from './catalog'

export const courseSource = pgEnum('course_source', [
  'ai',
  'builtin',
  'imported',
])
export const courseStatus = pgEnum('course_status', [
  'generating',
  'ready',
  'failed',
])
export const difficulty = pgEnum('difficulty', [
  'beginner',
  'intermediate',
  'advanced',
])
// The first four are the original vocabulary and stay for the content already
// in the database. The six after them are the teaching roles a lesson is built
// from now — see core/generation.ts for what each one owes the reader.
export const segmentType = pgEnum('segment_type', [
  'reading',
  'code',
  'practice',
  'quiz',
  'hook',
  'mechanism',
  'predict',
  'reveal',
  'derive',
  'check',
])
export const questionType = pgEnum('question_type', ['mcq', 'short_answer'])

// A lesson sequence for one topic from one source.
// ownerUserId null = shared/global; set = this user's AI-generated track.
export const courses = pgTable('courses', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  topicId: text('topic_id')
    .notNull()
    .references(() => topics.id, { onDelete: 'cascade' }),
  ownerUserId: text('owner_user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  source: courseSource('source').notNull(),
  sourceUrl: text('source_url'),
  model: text('model'),
  difficulty: difficulty('difficulty').notNull().default('beginner'),
  status: courseStatus('status').notNull().default('ready'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  estMinutes: integer('est_minutes').notNull().default(5),
  // Key terms the lesson introduces — linked to further reading at render time
  // when the user opts into "hyperlink key terms". Null/absent = no links.
  glossary: jsonb('glossary').$type<string[]>(),
})

// The chunk served at each pause (the session plan steps).
export const lessonSegments = pgTable('lesson_segments', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  lessonId: text('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  type: segmentType('type').notNull(),
  title: text('title').notNull(),
  content: jsonb('content').$type<Record<string, unknown>>(),
  estMinutes: integer('est_minutes').notNull().default(2),
})

export const quizQuestions = pgTable('quiz_questions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  segmentId: text('segment_id')
    .notNull()
    .references(() => lessonSegments.id, { onDelete: 'cascade' }),
  type: questionType('type').notNull().default('mcq'),
  prompt: text('prompt').notNull(),
  // mcq: the choices. null for short_answer.
  options: jsonb('options').$type<string[]>(),
  // mcq: index into options.
  correctIndex: integer('correct_index'),
  // short_answer: reference answer the AI grades against.
  expectedAnswer: text('expected_answer'),
  explanation: text('explanation'),
})

// In-session code practice (Sessions → Practice).
export const exercises = pgTable('exercises', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  segmentId: text('segment_id')
    .notNull()
    .references(() => lessonSegments.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  // 'js' (default) or 'git' — a terminal/git-simulator exercise.
  kind: text('kind').notNull().default('js'),
  // Authoring language for js/ts exercises; the runner type-strips 'ts' to JS.
  language: text('language').notNull().default('js'),
  starterCode: text('starter_code'),
  tests: jsonb('tests').$type<Record<string, unknown>[]>(),
  // Git exercises store { setup?, goals, solution } here (null for js/ts).
  config: jsonb('config').$type<Record<string, unknown>>(),
  solution: text('solution'),
  hint: text('hint'),
})
