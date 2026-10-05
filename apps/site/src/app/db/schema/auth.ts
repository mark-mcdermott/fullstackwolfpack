import { sql } from 'drizzle-orm'
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

// Auth is Better Auth's (see ./auth-schema.ts). This file owns the app's
// domain model for a person: profile, access, and gamification totals.
// `users.id` is the same id Better Auth minted, and `email`/`displayName`
// mirror its `user.email`/`user.name` — kept in step by the databaseHooks in
// src/app/server/auth.ts, because 60-odd call sites read displayName from here.

export const userRole = pgEnum('user_role', ['user', 'admin'])
export const userTier = pgEnum('user_tier', ['free', 'pro'])
export const subscriptionStatus = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
])

export const users = pgTable('users', {
  // Not defaulted: Better Auth mints the id and the profile row follows it.
  id: text('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  // Access control.
  role: userRole('role').notNull().default('user'),
  tier: userTier('tier').notNull().default('free'),
  // Profile (Settings → Profile).
  username: text('username').unique(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  timezone: text('timezone'),
  // Cached gamification totals — source of truth is xp_events / daily_activity.
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  // Presence: bumped by the client heartbeat; drives "online" in Community.
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Subscription stub — shape is Stripe-ready but no billing wired yet.
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tier: userTier('tier').notNull().default('pro'),
  status: subscriptionStatus('status').notNull().default('active'),
  provider: text('provider').notNull().default('stripe'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
