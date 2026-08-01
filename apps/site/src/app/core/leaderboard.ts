import { z } from 'zod'

// Global leaderboard domain — pure (no DOM, no db), shared by the server read,
// the api-client, and the page. Only opted-in users ever appear, so everything
// here assumes consent has already been checked upstream.

// How many ranked players the board shows.
export const LEADERBOARD_TOP_N = 100

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  name: z.string(),
  level: z.number().int(),
  xp: z.number().int(),
  streak: z.number().int(),
  isMe: z.boolean(),
})
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>

export const leaderboardViewSchema = z.object({
  entries: z.array(leaderboardEntrySchema),
  // The current user's row — even when they rank below the visible top N. Null
  // when they haven't opted in.
  me: leaderboardEntrySchema.nullable(),
  optedIn: z.boolean(),
})
export type LeaderboardView = z.infer<typeof leaderboardViewSchema>

export const leaderboardOptInRequest = z.object({ optIn: z.boolean() })
export type LeaderboardOptInInput = z.infer<typeof leaderboardOptInRequest>

// One XP-ranked player before display formatting.
export type RankableUser = {
  userId: string
  name: string
  level: number
  xp: number
  streak: number
}

// Assign 1-based positional ranks to an already-XP-sorted list and flag the
// current user's row.
export function rankEntries(
  rows: RankableUser[],
  meId: string,
): LeaderboardEntry[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    level: r.level,
    xp: r.xp,
    streak: r.streak,
    isMe: r.userId === meId,
  }))
}

// Ordinal label for a rank: 1 → "1st", 2 → "2nd", 13 → "13th", 22 → "22nd".
export function ordinal(n: number): string {
  const tens = Math.abs(n) % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  switch (Math.abs(n) % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}
