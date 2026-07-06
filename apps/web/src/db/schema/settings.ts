import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const credentialProvider = pgEnum('credential_provider', [
  'openai',
  'anthropic',
  'steam',
])

// One row per user — mirrors the Settings → Preferences / Focus Mode panels.
export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  defaultSessionLength: text('default_session_length').notNull().default('10/10'),
  defaultFocusMode: text('default_focus_mode').notNull().default('smart'),
  language: text('language').notNull().default('en'),
  startPage: text('start_page').notNull().default('dashboard'),
  autoStartNextLesson: boolean('auto_start_next_lesson').notNull().default(true),
  soundEffects: boolean('sound_effects').notNull().default(true),
  motivationalQuotes: boolean('motivational_quotes').notNull().default(true),
  compactMode: boolean('compact_mode').notNull().default(false),
  theme: text('theme').notNull().default('system'),
  distractionBlocking: boolean('distraction_blocking').notNull().default(true),
  fullscreen: boolean('fullscreen').notNull().default(true),
  breakReminderMinutes: integer('break_reminder_minutes').notNull().default(45),
  // Global lesson preferences (Settings → Lesson preferences). Consumed by the
  // pre-generation intake (ask_skill_level / ask_coverage) and lesson rendering
  // (linkify_terms). Opt-in.
  askSkillLevel: boolean('ask_skill_level').notNull().default(false),
  askCoverage: boolean('ask_coverage').notNull().default(false),
  linkifyTerms: boolean('linkify_terms').notNull().default(false),
  dataRetention: text('data_retention').notNull().default('forever'),
  shareAnalytics: boolean('share_analytics').notNull().default(true),
  enableRecommendations: boolean('enable_recommendations').notNull().default(true),
  // Public leaderboard consent — off by default. Only opted-in users appear in
  // the global ranking (and only then is their name/level/XP shown publicly).
  leaderboardOptIn: boolean('leaderboard_opt_in').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Focus Mode → Blocked sites.
export const focusBlockedSites = pgTable('focus_blocked_sites', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
})

// Encrypted third-party credentials (e.g. the user's OpenAI key). Ciphertext
// + iv only — encrypt/decrypt app-side, never return the plaintext to a client.
export const providerCredentials = pgTable(
  'provider_credentials',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: credentialProvider('provider').notNull(),
    ciphertext: text('ciphertext').notNull(),
    iv: text('iv').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('provider_credentials_user_provider_uq').on(
      t.userId,
      t.provider,
    ),
  ],
)
