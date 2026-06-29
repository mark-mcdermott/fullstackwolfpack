import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ZENCATS auth: passkeys/WebAuthn primary, TOTP fallback. No passwords.

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  // TOTP fallback secret (encrypt at rest in production).
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
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
