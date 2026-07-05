import type { UserAchievementRow } from './progress'

// Pure achievement-earning engine. Given a user's aggregate stats snapshot and
// the catalog's criteria, it derives each badge's status + progress. No DB, no
// DOM — the server (src/server/app-data.ts) builds the snapshot and calls this;
// unit-tested directly. Deriving on read means badges "just work" without a
// separate award/write path.

export type AchievementCriteria =
  | { type: 'streak'; days: number }
  | { type: 'focus_sessions'; count: number }
  | { type: 'topic_lessons'; topic: string; count: number }
  | { type: 'hours_learned'; hours: number }
  | { type: 'quiz_high_score'; pct: number; count: number }
  | { type: 'complete_topic'; topic: string }
  | { type: 'session_before'; hour: number }
  | { type: 'accuracy_streak'; pct: number; days: number }
  | { type: 'reach_level'; level: number }
  | { type: 'perfect_lessons'; count: number }
  | { type: 'all_achievements' }

export type AchievementDef = {
  slug: string
  progressTarget: number
  criteria: Record<string, unknown>
}

// Everything the engine needs to score the catalog, aggregated by the server.
export type AchievementStats = {
  level: number
  bestStreak: number
  hoursLearned: number
  accuracyPct: number
  focusSessions: number
  highScoreQuizzes: number
  perfectLessons: number
  earlySession: boolean
  topicLessons: Record<string, number> // topic slug → lessons completed
  completedTopics: readonly string[] // slugs of fully-completed topics
}

type Progress = { current: number; target: number }

// Raw progress for a single non-meta criterion (before clamping to the target).
function progressFor(c: AchievementCriteria, s: AchievementStats): Progress {
  switch (c.type) {
    case 'streak':
      return { current: s.bestStreak, target: c.days }
    case 'focus_sessions':
      return { current: s.focusSessions, target: c.count }
    case 'topic_lessons':
      return { current: s.topicLessons[c.topic] ?? 0, target: c.count }
    case 'hours_learned':
      return { current: s.hoursLearned, target: c.hours }
    case 'quiz_high_score':
      return { current: s.highScoreQuizzes, target: c.count }
    case 'complete_topic':
      return { current: s.completedTopics.includes(c.topic) ? 1 : 0, target: 1 }
    case 'session_before':
      return { current: s.earlySession ? 1 : 0, target: 1 }
    case 'accuracy_streak':
      // Approximation: no per-day accuracy history in the snapshot, so treat a
      // best streak at/above the target as the streak length once overall
      // accuracy clears the bar.
      return {
        current: s.accuracyPct >= c.pct ? Math.min(s.bestStreak, c.days) : 0,
        target: c.days,
      }
    case 'reach_level':
      return { current: s.level, target: c.level }
    case 'perfect_lessons':
      return { current: s.perfectLessons, target: c.count }
    default:
      // `all_achievements` (resolved in the second pass) and any unrecognized
      // criteria fall through to no progress.
      return { current: 0, target: 1 }
  }
}

function statusFor(current: number, target: number): UserAchievementRow['status'] {
  if (target > 0 && current >= target) return 'earned'
  return current > 0 ? 'in_progress' : 'locked'
}

// Score the whole catalog. `all_achievements` is resolved in a second pass once
// every other badge's status is known.
export function evaluateAchievements(
  defs: AchievementDef[],
  stats: AchievementStats,
): UserAchievementRow[] {
  const rows: UserAchievementRow[] = defs.map((def) => {
    const criteria = def.criteria as AchievementCriteria
    if (criteria.type === 'all_achievements') {
      return {
        achievementSlug: def.slug,
        status: 'locked',
        progressCurrent: 0,
        earnedAt: null,
      }
    }
    const { current, target } = progressFor(criteria, stats)
    return {
      achievementSlug: def.slug,
      status: statusFor(current, target),
      progressCurrent: Math.max(0, Math.min(current, target)),
      earnedAt: null,
    }
  })

  const meta = defs.filter(
    (d) => (d.criteria as AchievementCriteria).type === 'all_achievements',
  )
  if (meta.length > 0) {
    const others = rows.filter(
      (r) => !meta.some((m) => m.slug === r.achievementSlug),
    )
    const earnedCount = others.filter((r) => r.status === 'earned').length
    const allEarned = others.length > 0 && earnedCount === others.length
    for (const row of rows) {
      if (!meta.some((m) => m.slug === row.achievementSlug)) continue
      row.status = allEarned ? 'earned' : earnedCount > 0 ? 'in_progress' : 'locked'
      row.progressCurrent = allEarned ? 1 : 0
    }
  }

  return rows
}
