import { describe, expect, it } from 'vitest'
import { bucketAchievements, levelProgress, relativeTime } from './progress'

const LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 400 },
  { level: 3, xpRequired: 840 },
]

describe('levelProgress', () => {
  it('puts a fresh user at level 1 with the full bar to go', () => {
    expect(levelProgress(0, LEVELS)).toEqual({
      level: 1,
      xpToNext: 400,
      levelPct: 0,
    })
  })

  it('reports fractional progress within the current level', () => {
    expect(levelProgress(200, LEVELS)).toEqual({
      level: 1,
      xpToNext: 200,
      levelPct: 50,
    })
  })

  it('rolls over exactly at a threshold', () => {
    expect(levelProgress(400, LEVELS)).toEqual({
      level: 2,
      xpToNext: 440,
      levelPct: 0,
    })
  })

  it('caps at the max level with nothing left to earn', () => {
    expect(levelProgress(9999, LEVELS)).toEqual({
      level: 3,
      xpToNext: 0,
      levelPct: 100,
    })
  })

  it('is safe with no level table', () => {
    expect(levelProgress(50, [])).toEqual({
      level: 1,
      xpToNext: 0,
      levelPct: 0,
    })
  })
})

describe('bucketAchievements', () => {
  const catalog = [
    { slug: 'a', name: 'A', description: 'da', progressTarget: 7 },
    { slug: 'b', name: 'B', description: 'db', progressTarget: 3 },
    { slug: 'c', name: 'C', description: 'dc', progressTarget: 10 },
  ]

  it('splits by status and fills current/target/earnedAt', () => {
    const earnedAt = '2025-05-20T00:00:00.000Z'
    const view = bucketAchievements(catalog, [
      { achievementSlug: 'a', status: 'earned', progressCurrent: 7, earnedAt },
      { achievementSlug: 'b', status: 'in_progress', progressCurrent: 2, earnedAt: null },
    ])

    expect(view.earned).toEqual([
      { slug: 'a', name: 'A', description: 'da', current: 7, target: 7, earnedAt },
    ])
    expect(view.inProgress).toEqual([
      { slug: 'b', name: 'B', description: 'db', current: 2, target: 3, earnedAt: null },
    ])
    // 'c' has no user row → locked with zero progress.
    expect(view.locked).toEqual([
      { slug: 'c', name: 'C', description: 'dc', current: 0, target: 10, earnedAt: null },
    ])
  })

  it('treats everything as locked for a brand-new user', () => {
    const view = bucketAchievements(catalog, [])
    expect(view.earned).toHaveLength(0)
    expect(view.inProgress).toHaveLength(0)
    expect(view.locked).toHaveLength(3)
  })
})

describe('relativeTime', () => {
  const now = new Date('2025-05-20T12:00:00.000Z')
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it('handles seconds, minutes, hours, days', () => {
    expect(relativeTime(ago(10_000), now)).toBe('just now')
    expect(relativeTime(ago(60_000), now)).toBe('1 minute ago')
    expect(relativeTime(ago(3 * 60_000), now)).toBe('3 minutes ago')
    expect(relativeTime(ago(2 * 3_600_000), now)).toBe('2 hours ago')
    expect(relativeTime(ago(3 * 86_400_000), now)).toBe('3 days ago')
  })

  it('falls back to an absolute date past a week', () => {
    const old = '2025-04-01T00:00:00.000Z'
    const absolute = new Date(old).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    expect(relativeTime(old, now)).toBe(absolute)
    expect(relativeTime(old, now)).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
  })
})
