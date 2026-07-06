import { eq } from 'drizzle-orm'
import type { UserPreferences } from '../core/schemas'
import { db } from '../db'
import { userSettings } from '../db/schema'

// Global lesson preferences live on the existing per-user user_settings row.
// A user with no row yet gets the opt-in defaults.
export const DEFAULT_PREFERENCES: UserPreferences = {
  askSkillLevel: false,
  askCoverage: false,
  linkifyTerms: false,
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const [row] = await db
    .select({
      askSkillLevel: userSettings.askSkillLevel,
      askCoverage: userSettings.askCoverage,
      linkifyTerms: userSettings.linkifyTerms,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
  return row ?? DEFAULT_PREFERENCES
}

// Merge a partial patch onto the current prefs and upsert. Only the preference
// columns (+ updatedAt) are written — other user_settings columns keep defaults.
export async function savePreferences(
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const next = { ...(await getPreferences(userId)), ...patch }
  await db
    .insert(userSettings)
    .values({ userId, ...next })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...next, updatedAt: new Date() },
    })
  return next
}
