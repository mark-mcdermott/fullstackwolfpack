import { xpForFocusSession } from '../core/focus-session'
import type { FocusSessionInput } from '../core/schemas'
import { db } from '../db'
import { sessions } from '../db/schema'
import { grantXp, logActivityAndStreak } from './rewards'

// Persist a completed focus session as a `sessions` row (focusMode = true) and
// grant its rewards: session XP (from the bounded result), a daily-activity
// contribution of the learn minutes, and a streak advance on a new active day.
// Returns the total XP granted so the UI can surface it.
export async function recordFocusSession(
  userId: string,
  input: FocusSessionInput,
  now: Date = new Date(),
): Promise<{ xp: number }> {
  await db.insert(sessions).values({
    userId,
    playMinutes: input.playMinutes,
    learnMinutes: input.learnMinutes,
    playIntervalMin: input.playIntervalMin,
    learnIntervalMin: input.learnIntervalMin,
    focusScore: input.focusScore,
    focusMode: true,
    endedAt: now,
  })

  const sessionXp = xpForFocusSession({
    learnMinutes: input.learnMinutes,
    focusScore: input.focusScore,
  })
  await grantXp(userId, {
    type: 'session',
    xp: sessionXp,
    description: 'Focus session',
  })

  const streakXp = await logActivityAndStreak(userId, now, {
    minutesLearned: input.learnMinutes,
  })

  return { xp: sessionXp + streakXp }
}
