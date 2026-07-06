import { sql } from 'drizzle-orm'
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

// Cumulative playtime per game per user (Arcade telemetry). One row per
// (user, game); `seconds` is the running total across every session, bumped by
// the player's periodic flush. `gameId` is the surface-agnostic key
// (`<source>:<id>` — see core/playtime.ts) so catalog/embed/upload titles never
// collide; `title` + `source` are denormalized for cheap display without a join.
export const gamePlaytime = pgTable(
  'game_playtime',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: text('game_id').notNull(),
    source: text('source').notNull(),
    title: text('title').notNull(),
    seconds: integer('seconds').notNull().default(0),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('game_playtime_user_game_uq').on(t.userId, t.gameId)],
)
