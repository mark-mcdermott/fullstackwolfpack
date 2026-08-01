import { and, asc, count, desc, eq, gt } from 'drizzle-orm'
import {
  LEADERBOARD_TOP_N,
  type LeaderboardEntry,
  type LeaderboardView,
  rankEntries,
} from '../core/leaderboard'
import { db } from '../db'
import { users, userSettings } from '../db/schema'

// The top N opted-in players by XP (shared by the authed + public reads).
async function topRankedRows() {
  return db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      level: users.level,
      xp: users.xp,
      streak: users.currentStreak,
    })
    .from(users)
    .innerJoin(userSettings, eq(userSettings.userId, users.id))
    .where(eq(userSettings.leaderboardOptIn, true))
    .orderBy(desc(users.xp), asc(users.id))
    .limit(LEADERBOARD_TOP_N)
}

// Public (guest) leaderboard: the top-N ranking with no "me" row — guests aren't
// on it (their XP is local), so the client compares its guest XP to the board's
// cutoff to decide the "you made the board" nudge.
export async function getPublicLeaderboard(): Promise<LeaderboardView> {
  const rows = await topRankedRows()
  const entries = rankEntries(
    rows.map((r) => ({
      userId: r.userId,
      name: r.username ?? r.displayName,
      level: r.level,
      xp: r.xp,
      streak: r.streak,
    })),
    '', // no user → no isMe
  )
  return { entries, me: null, optedIn: false }
}

// The top N opted-in players by XP, plus the current user's own row (even when
// they rank below the cut) and whether they're currently opted in.
export async function getLeaderboard(userId: string): Promise<LeaderboardView> {
  const rows = await topRankedRows()

  const entries = rankEntries(
    rows.map((r) => ({
      userId: r.userId,
      name: r.username ?? r.displayName,
      level: r.level,
      xp: r.xp,
      streak: r.streak,
    })),
    userId,
  )

  const [mySettings] = await db
    .select({ optIn: userSettings.leaderboardOptIn })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
  const optedIn = mySettings?.optIn ?? false

  let me: LeaderboardEntry | null = entries.find((e) => e.isMe) ?? null

  // Opted in but ranked below the visible top N — resolve the true rank from the
  // full opted-in set (count everyone ahead by XP).
  if (optedIn && !me) {
    const [myRow] = await db
      .select({
        username: users.username,
        displayName: users.displayName,
        level: users.level,
        xp: users.xp,
        streak: users.currentStreak,
      })
      .from(users)
      .where(eq(users.id, userId))

    if (myRow) {
      const [ahead] = await db
        .select({ n: count() })
        .from(users)
        .innerJoin(userSettings, eq(userSettings.userId, users.id))
        .where(
          and(
            eq(userSettings.leaderboardOptIn, true),
            gt(users.xp, myRow.xp),
          ),
        )
      me = {
        rank: Number(ahead?.n ?? 0) + 1,
        name: myRow.username ?? myRow.displayName,
        level: myRow.level,
        xp: myRow.xp,
        streak: myRow.streak,
        isMe: true,
      }
    }
  }

  return { entries, me, optedIn }
}

// Set the user's public-leaderboard consent, then return the fresh view so the
// UI updates in one round-trip.
export async function setLeaderboardOptIn(
  userId: string,
  optIn: boolean,
): Promise<LeaderboardView> {
  await db
    .insert(userSettings)
    .values({ userId, leaderboardOptIn: optIn })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { leaderboardOptIn: optIn, updatedAt: new Date() },
    })
  return getLeaderboard(userId)
}
