import type { FocusSessionInput } from '../core/schemas'
import { db } from '../db'
import { sessions } from '../db/schema'

// Persist a completed focus session as a `sessions` row (focusMode = true), so
// it feeds hours-learned/played stats and the Focus-Mode badge. startedAt uses
// the table default; endedAt is stamped now.
export async function recordFocusSession(
  userId: string,
  input: FocusSessionInput,
): Promise<void> {
  await db.insert(sessions).values({
    userId,
    playMinutes: input.playMinutes,
    learnMinutes: input.learnMinutes,
    playIntervalMin: input.playIntervalMin,
    learnIntervalMin: input.learnIntervalMin,
    focusScore: input.focusScore,
    focusMode: true,
    endedAt: new Date(),
  })
}
