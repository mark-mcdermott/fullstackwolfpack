import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// One row per AI course generation, recording wall-clock duration. Powers the
// ETA shown on the Generate Course progress bar — the running average of recent
// successful durations. Deliberately decoupled (plain-text topic/difficulty, no
// FKs) so it's a pure metrics sink that never blocks or cascades enrollment.
export const generationTimings = pgTable('generation_timings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  topicId: text('topic_id'),
  difficulty: text('difficulty'),
  durationMs: integer('duration_ms').notNull(),
  succeeded: boolean('succeeded').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
