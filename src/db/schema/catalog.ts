import { sql } from 'drizzle-orm'
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const topicCategory = pgEnum('topic_category', [
  'frontend',
  'backend',
  'devops',
  'databases',
  'tools',
  'ai_data',
])
export const topicStatus = pgEnum('topic_status', ['active', 'coming_soon'])

// Global topic catalog (Topics page). Per-user progress lives in user_topics.
export const topics = pgTable('topics', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: topicCategory('category').notNull(),
  icon: text('icon'),
  description: text('description'),
  status: topicStatus('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Global achievement catalog (Achievements page).
export const achievements = pgTable('achievements', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  icon: text('icon'),
  tier: text('tier'),
  // Rule the engine evaluates, e.g. { "type": "streak", "days": 7 }.
  criteria: jsonb('criteria').$type<Record<string, unknown>>(),
  progressTarget: integer('progress_target').notNull().default(1),
  xpReward: integer('xp_reward').notNull().default(0),
})

// XP thresholds + per-level rewards (level bar, "Level 13 Reward" preview).
export const levels = pgTable('levels', {
  level: integer('level').primaryKey(),
  xpRequired: integer('xp_required').notNull(),
  rewards: jsonb('rewards').$type<string[]>(),
})
