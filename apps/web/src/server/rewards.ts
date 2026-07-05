import { desc, eq, sql } from 'drizzle-orm'
import { nextStreak, xpForStreakDay } from '../core/learning'
import { db } from '../db'
import { dailyActivity, users, xpEvents } from '../db/schema'

// Shared reward writes — the XP ledger, daily-activity log, and streak advance.
// Used by both lesson completion (server/learning.ts) and focus sessions
// (server/focus.ts) so the gamification stays consistent in one place.

const dateStr = (d: Date): string => d.toISOString().slice(0, 10)

// Matches the `xp_event_type` pg enum.
export type XpType =
  | 'lesson_completed'
  | 'quiz'
  | 'streak'
  | 'achievement'
  | 'session'

export type XpGrant = {
  type: XpType
  xp: number
  refType?: string
  refId?: string
  description?: string
}

// Append an XP ledger row and bump the cached total on `users`.
export async function grantXp(userId: string, e: XpGrant): Promise<void> {
  if (e.xp === 0) return
  await db.insert(xpEvents).values({
    userId,
    type: e.type,
    xp: e.xp,
    refType: e.refType ?? null,
    refId: e.refId ?? null,
    description: e.description ?? null,
  })
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${e.xp}` })
    .where(eq(users.id, userId))
}

export type DailyContribution = {
  lessonsCompleted?: number
  minutesLearned?: number
}

// Upsert today's daily-activity row (incrementing the given contribution),
// advance the streak on a new active day, and grant the streak XP. Returns the
// streak XP granted (0 if today was already counted). The last-active day is read
// *before* today's row is written so the streak math is correct.
export async function logActivityAndStreak(
  userId: string,
  now: Date,
  contribution: DailyContribution = {},
): Promise<number> {
  const lessons = Math.max(0, Math.round(contribution.lessonsCompleted ?? 0))
  const minutes = Math.max(0, Math.round(contribution.minutesLearned ?? 0))

  const [u] = await db
    .select({
      currentStreak: users.currentStreak,
      bestStreak: users.bestStreak,
    })
    .from(users)
    .where(eq(users.id, userId))
  if (!u) return 0

  const [last] = await db
    .select({ date: dailyActivity.date })
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId))
    .orderBy(desc(dailyActivity.date))
    .limit(1)

  const result = nextStreak(last?.date ?? null, now, u.currentStreak)

  await db
    .insert(dailyActivity)
    .values({
      userId,
      date: dateStr(now),
      status: 'completed',
      lessonsCompleted: lessons,
      minutesLearned: minutes,
    })
    .onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.date],
      set: {
        status: 'completed',
        lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + ${lessons}`,
        minutesLearned: sql`${dailyActivity.minutesLearned} + ${minutes}`,
      },
    })

  if (!result.isNewDay) return 0 // already counted today

  await db
    .update(users)
    .set({
      currentStreak: result.streak,
      bestStreak: Math.max(u.bestStreak, result.streak),
    })
    .where(eq(users.id, userId))

  const streakXp = xpForStreakDay(result.streak)
  await grantXp(userId, {
    type: 'streak',
    xp: streakXp,
    description: `Day ${result.streak} streak`,
  })
  return streakXp
}
