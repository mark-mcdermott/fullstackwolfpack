import { sql } from 'drizzle-orm'
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

// Spaced-repetition state. The scheduler itself is pure (src/core/review.ts, SM-2);
// these tables just persist a card's memory state + an append-only review history.
// Swapping SM-2 → ts-fsrs later changes the scheduler fields (stability/difficulty
// instead of interval/efactor) — a schema migration, but the same shape of tables.

// What a card points at (polymorphic, like xp_events.refType). Only `quiz_question`
// is wired for now; `concept`/`lesson` are reserved for later.
export const reviewItemType = pgEnum('review_item_type', [
  'quiz_question',
  'concept',
  'lesson',
])
export const reviewRating = pgEnum('review_rating', [
  'again',
  'hard',
  'good',
  'easy',
])

// One memory-state row per user per reviewable item (see core/review.ts `ReviewCard`).
export const reviewCards = pgTable(
  'review_cards',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemType: reviewItemType('item_type').notNull(),
    itemId: text('item_id').notNull(), // -> quiz_questions.id / lessons.id / concept key
    // SM-2 scheduler state.
    interval: integer('interval').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    efactor: doublePrecision('efactor').notNull().default(2.5),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    due: timestamp('due', { withTimezone: true }).notNull().defaultNow(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('review_cards_user_item_uq').on(t.userId, t.itemType, t.itemId),
    index('review_cards_due_idx').on(t.userId, t.due), // "due today" query
  ],
)

// Append-only history — one row per review, for accuracy-over-time and future
// per-user FSRS weight training.
export const reviewLogs = pgTable('review_logs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  cardId: text('card_id')
    .notNull()
    .references(() => reviewCards.id, { onDelete: 'cascade' }),
  rating: reviewRating('rating').notNull(),
  interval: integer('interval').notNull(),
  efactor: doublePrecision('efactor').notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
