import { and, desc, eq, gte, sql } from 'drizzle-orm'
import {
  xpForPlaySeconds,
  type GamePlaytime,
  type PlaytimeRecordInput,
  type PlaytimeSource,
} from '../core/playtime'
import { db } from '../db'
import { gamePlaytime, xpEvents } from '../db/schema'
import { grantXp } from './rewards'

// Add a flush of seconds to a game's running total. Upserts on the
// (user, game) unique index — the first flush inserts, every later one
// increments in place — and returns the new cumulative total for the game.
export async function recordPlaytime(
  userId: string,
  input: PlaytimeRecordInput,
  now: Date = new Date(),
): Promise<{ seconds: number }> {
  const [row] = await db
    .insert(gamePlaytime)
    .values({
      userId,
      gameId: input.gameId,
      source: input.source,
      title: input.title,
      seconds: input.seconds,
      lastPlayedAt: now,
    })
    .onConflictDoUpdate({
      target: [gamePlaytime.userId, gamePlaytime.gameId],
      set: {
        seconds: sql`${gamePlaytime.seconds} + ${input.seconds}`,
        // Keep the display name current — an upload can be re-added under a
        // tidier title, and the newest flush wins.
        title: input.title,
        lastPlayedAt: now,
      },
    })
    .returning({ seconds: gamePlaytime.seconds })

  // Modest, daily-capped play XP so gaming contributes to level/leaderboard.
  const [today] = await db
    .select({ earned: sql<number>`coalesce(sum(${xpEvents.xp}), 0)` })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, userId),
        eq(xpEvents.type, 'play'),
        gte(xpEvents.createdAt, startOfDay(now)),
      ),
    )
  const playXp = xpForPlaySeconds(input.seconds, Number(today?.earned ?? 0))
  if (playXp > 0) {
    await grantXp(userId, {
      type: 'play',
      xp: playXp,
      refType: 'game',
      refId: input.gameId,
      description: 'Playtime',
    })
  }

  return { seconds: row?.seconds ?? input.seconds }
}

function startOfDay(now: Date): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d
}

// Every game the user has played, most-recently-played first.
export async function getPlaytime(userId: string): Promise<GamePlaytime[]> {
  const rows = await db
    .select()
    .from(gamePlaytime)
    .where(eq(gamePlaytime.userId, userId))
    .orderBy(desc(gamePlaytime.lastPlayedAt))

  return rows.map((r) => ({
    gameId: r.gameId,
    source: r.source as PlaytimeSource,
    title: r.title,
    seconds: r.seconds,
    lastPlayedAt: r.lastPlayedAt.toISOString(),
  }))
}
