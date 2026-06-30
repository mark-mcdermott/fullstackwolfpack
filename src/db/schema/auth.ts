import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ZENCATS auth: passkeys/WebAuthn primary, TOTP fallback. No passwords.

export const userRole = pgEnum('user_role', ['user', 'admin'])
export const userTier = pgEnum('user_tier', ['free', 'pro'])
export const subscriptionStatus = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
])

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  // TOTP fallback secret (encrypt at rest in production).
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
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

// One row per registered passkey/authenticator.
export const credentials = pgTable('credentials', {
  // credentialID, base64url-encoded
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // base64url-encoded COSE public key
  publicKey: text('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).notNull().default(0),
  // JSON array of AuthenticatorTransport values
  transports: text('transports'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Short-lived WebAuthn challenges, keyed by email (or session id).
export const webauthnChallenges = pgTable('webauthn_challenges', {
  key: text('key').primaryKey(),
  challenge: text('challenge').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Credential = typeof credentials.$inferSelect
export type NewCredential = typeof credentials.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
