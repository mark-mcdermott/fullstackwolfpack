import type { AchievementItem, AchievementsView } from './app-data'

// Pure progress/derivation math. No DOM, no DB — unit-tested directly and
// reused by the server functions in `api/` and (for formatting) the pages.

export type LevelThreshold = { level: number; xpRequired: number }

// Where a user sits given their total XP and the cumulative level thresholds.
export function levelProgress(
  xp: number,
  levels: LevelThreshold[],
): { level: number; xpToNext: number; levelPct: number } {
  const sorted = [...levels].sort((a, b) => a.xpRequired - b.xpRequired)
  if (!sorted.length) return { level: 1, xpToNext: 0, levelPct: 0 }

  let current = sorted[0]
  let next: LevelThreshold | null = null
  for (let i = 0; i < sorted.length; i++) {
    if (xp >= sorted[i].xpRequired) {
      current = sorted[i]
      next = sorted[i + 1] ?? null
    }
  }

  if (!next) return { level: current.level, xpToNext: 0, levelPct: 100 }

  const span = next.xpRequired - current.xpRequired
  const into = xp - current.xpRequired
  return {
    level: current.level,
    xpToNext: next.xpRequired - xp,
    levelPct: span > 0 ? Math.round((into / span) * 100) : 0,
  }
}

export type AchievementCatalogRow = {
  slug: string
  name: string
  description: string
  progressTarget: number
}

export type UserAchievementRow = {
  achievementSlug: string
  status: 'locked' | 'in_progress' | 'earned'
  progressCurrent: number
  earnedAt: string | Date | null
}

// Join the achievement catalog with a user's rows and bucket by status,
// preserving catalog order within each bucket.
export function bucketAchievements(
  catalog: AchievementCatalogRow[],
  userRows: UserAchievementRow[],
): AchievementsView {
  const bySlug = new Map(userRows.map((r) => [r.achievementSlug, r]))
  const view: AchievementsView = { earned: [], inProgress: [], locked: [] }

  for (const a of catalog) {
    const row = bySlug.get(a.slug)
    const item: AchievementItem = {
      slug: a.slug,
      name: a.name,
      description: a.description,
      current: row?.progressCurrent ?? 0,
      target: a.progressTarget,
      earnedAt: row?.earnedAt ? new Date(row.earnedAt).toISOString() : null,
    }
    if (row?.status === 'earned') view.earned.push(item)
    else if (row?.status === 'in_progress') view.inProgress.push(item)
    else view.locked.push(item)
  }

  return view
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

// Human-friendly elapsed time; absolute date once it's older than a week.
export function relativeTime(at: string | Date, now: Date = new Date()): string {
  const then = new Date(at).getTime()
  const diff = now.getTime() - then
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), 'minute')
  if (diff < DAY) return plural(Math.floor(diff / HOUR), 'hour')
  if (diff < 7 * DAY) return plural(Math.floor(diff / DAY), 'day')
  return new Date(at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
