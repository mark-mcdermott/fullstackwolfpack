import { desc, eq, sql } from 'drizzle-orm'
import type {
  GamePlaytime,
  PlaytimeRecordInput,
  PlaytimeSource,
} from '../core/playtime'
import { db } from '../db'
import { gamePlaytime } from '../db/schema'

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

  return { seconds: row?.seconds ?? input.seconds }
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
