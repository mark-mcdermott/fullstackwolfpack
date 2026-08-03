import { describe, expect, it } from 'vitest'
import {
  evaluateAchievements,
  type AchievementDef,
  type AchievementStats,
} from './achievements'
import { SEED_ACHIEVEMENTS } from '@/db/seed-data'

const zeroStats: AchievementStats = {
  level: 1,
  bestStreak: 0,
  hoursLearned: 0,
  accuracyPct: 0,
  focusSessions: 0,
  highScoreQuizzes: 0,
  perfectLessons: 0,
  earlySession: false,
  topicLessons: {},
  completedTopics: [],
}

function bySlug(rows: ReturnType<typeof evaluateAchievements>) {
  return new Map(rows.map((r) => [r.achievementSlug, r]))
}

describe('evaluateAchievements', () => {
  it('locks everything but the level badge for a brand-new user', () => {
    const rows = bySlug(evaluateAchievements(SEED_ACHIEVEMENTS, zeroStats))
    // Everyone starts at level 1, so "Legend" (reach level 20) shows 1/20.
    expect(rows.get('legend')?.status).toBe('in_progress')
    expect(rows.get('legend')?.progressCurrent).toBe(1)
    for (const [slug, r] of rows) {
      if (slug === 'legend') continue
      expect(r.status).toBe('locked')
    }
    expect(rows.size).toBe(SEED_ACHIEVEMENTS.length)
  })

  it('earns level, streak and hours badges once the bar is cleared', () => {
    const rows = bySlug(
      evaluateAchievements(SEED_ACHIEVEMENTS, {
        ...zeroStats,
        level: 20,
        bestStreak: 7,
        hoursLearned: 100,
      }),
    )
    expect(rows.get('legend')?.status).toBe('earned')
    expect(rows.get('week-warrior')?.status).toBe('earned')
    expect(rows.get('hot-streak')?.status).toBe('earned')
    expect(rows.get('learning-machine')?.status).toBe('earned')
  })

  it('reports in-progress with clamped current for partial progress', () => {
    const rows = bySlug(
      evaluateAchievements(SEED_ACHIEVEMENTS, {
        ...zeroStats,
        topicLessons: { typescript: 9 },
      }),
    )
    const ts = rows.get('typescript-novice')
    expect(ts?.status).toBe('in_progress')
    expect(ts?.progressCurrent).toBe(9) // target 15
  })

  it('earns complete_topic only when the topic is fully done', () => {
    const done = bySlug(
      evaluateAchievements(SEED_ACHIEVEMENTS, {
        ...zeroStats,
        completedTopics: ['git-github'],
      }),
    )
    expect(done.get('cli-commander')?.status).toBe('earned')
  })

  it('earns master-wolf only when every other badge is earned', () => {
    const fullStats: AchievementStats = {
      level: 20,
      bestStreak: 7,
      hoursLearned: 100,
      accuracyPct: 100,
      focusSessions: 10,
      highScoreQuizzes: 10,
      perfectLessons: 50,
      earlySession: true,
      topicLessons: { typescript: 15 },
      completedTopics: ['git-github'],
    }
    const rows = bySlug(evaluateAchievements(SEED_ACHIEVEMENTS, fullStats))
    expect(rows.get('master-wolf')?.status).toBe('earned')
  })

  it('holds master-wolf in progress when some but not all are earned', () => {
    const rows = bySlug(
      evaluateAchievements(SEED_ACHIEVEMENTS, { ...zeroStats, level: 20 }),
    )
    expect(rows.get('master-wolf')?.status).toBe('in_progress')
  })

  it('is robust to an unknown criteria type (locks it)', () => {
    const defs: AchievementDef[] = [
      { slug: 'mystery', progressTarget: 1, criteria: { type: 'unknown' } },
    ]
    const rows = evaluateAchievements(defs, zeroStats)
    expect(rows[0].status).toBe('locked')
  })
})
