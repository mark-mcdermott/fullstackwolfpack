import { z } from 'zod'

// Arcade playtime domain — pure (no DOM, no fs), shared by the client tracker,
// the api-client, the server upsert, and the gallery display. Playtime is the
// wall-clock time a game screen stays open, flushed in deltas as the user plays.

// Every playable game exposes `source` + `id`; the pair is globally unique (a
// catalog ROM, an embed game, and an upload could otherwise share a bare id), so
// this composed key is what we store and look up by.
export const PLAYTIME_SOURCES = ['catalog', 'embed', 'upload'] as const
export type PlaytimeSource = (typeof PLAYTIME_SOURCES)[number]

export function gameKey(game: { source: PlaytimeSource; id: string }): string {
  return `${game.source}:${game.id}`
}

// Modest XP for playing, so games contribute to level/leaderboard — but learning
// stays the fast path (lessons/quizzes are worth far more). Daily-capped so the
// board can't be topped by idle gaming. `earnedTodayXp` is how much play XP the
// user has already banked today; a flush earns up to the remaining cap.
export const PLAY_XP_PER_MINUTE = 1
export const PLAY_XP_DAILY_CAP = 30
export function xpForPlaySeconds(seconds: number, earnedTodayXp: number): number {
  const gross = Math.floor(Math.max(0, seconds) / 60) * PLAY_XP_PER_MINUTE
  const remaining = Math.max(0, PLAY_XP_DAILY_CAP - Math.max(0, earnedTodayXp))
  return Math.min(gross, remaining)
}

// A single flush from the player: the seconds played since the last flush.
// Bounded so a forged request can't inflate a user's own hours — one flush can
// only ever add up to two hours (the interval flush fires far more often).
export const playtimeRecordRequest = z.object({
  gameId: z.string().min(1).max(200),
  source: z.enum(PLAYTIME_SOURCES),
  title: z.string().min(1).max(200),
  seconds: z.number().int().min(1).max(7200),
})
export type PlaytimeRecordInput = z.infer<typeof playtimeRecordRequest>

// The new cumulative total for the game the flush touched.
export const playtimeRecordResultSchema = z.object({
  seconds: z.number().int().nonnegative(),
})
export type PlaytimeRecordResult = z.infer<typeof playtimeRecordResultSchema>

// One game's running total (GET /api/me/playtime).
export const gamePlaytimeSchema = z.object({
  gameId: z.string(),
  source: z.enum(PLAYTIME_SOURCES),
  title: z.string(),
  seconds: z.number().int().nonnegative(),
  lastPlayedAt: z.string(),
})
export type GamePlaytime = z.infer<typeof gamePlaytimeSchema>

export const playtimeListSchema = z.object({
  playtime: z.array(gamePlaytimeSchema),
})
export type PlaytimeList = z.infer<typeof playtimeListSchema>

// Compact human label for a tile: "<1m" / "42m" / "3h 05m".
export function formatPlaytime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  if (total < 60) return '<1m'
  const mins = Math.floor(total / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${String(mins % 60).padStart(2, '0')}m`
}
