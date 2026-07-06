import { sql } from 'drizzle-orm'
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

// Community foundation: friends + 1:1 direct messages. Serverless-friendly —
// presence is a `users.lastActiveAt` timestamp (in auth.ts), the client polls,
// and no realtime service is required (a push layer can be added later).

export const friendshipStatus = pgEnum('friendship_status', [
  'pending',
  'accepted',
])

// A friend relationship. Directional at request time (requester → addressee);
// symmetric once accepted, so "my friends" = accepted rows where I'm either side.
export const friendships = pgTable(
  'friendships',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    requesterId: text('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    addresseeId: text('addressee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: friendshipStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('friendship_pair_uq').on(t.requesterId, t.addresseeId)],
)

// A 1:1 direct message between two users. `readAt` null = unread by the recipient.
export const directMessages = pgTable(
  'direct_messages',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (t) => [
    index('dm_recipient_sender_idx').on(t.recipientId, t.senderId),
    index('dm_sender_recipient_idx').on(t.senderId, t.recipientId),
  ],
)
