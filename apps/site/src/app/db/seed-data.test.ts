import { describe, expect, it } from 'vitest'
import {
  SEED_ACHIEVEMENTS,
  SEED_LEVELS,
  SEED_TOPICS,
  TOPIC_CATEGORIES,
} from './seed-data'

describe('seed data', () => {
  it('topics have unique slugs and valid categories', () => {
    const slugs = SEED_TOPICS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const t of SEED_TOPICS) {
      expect(TOPIC_CATEGORIES).toContain(t.category)
      expect(t.name).toBeTruthy()
    }
  })

  it('ships a healthy starter catalog', () => {
    // Topics are intentionally pruned to a focused set right now (others are
    // commented out in seed-data); just require at least one active topic.
    expect(SEED_TOPICS.length).toBeGreaterThanOrEqual(1)
    expect(SEED_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(8)
  })

  it('achievements have unique slugs and positive targets', () => {
    const slugs = SEED_ACHIEVEMENTS.map((a) => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const a of SEED_ACHIEVEMENTS) {
      expect(a.progressTarget).toBeGreaterThan(0)
    }
  })

  it('levels start at 0 xp and increase monotonically', () => {
    expect(SEED_LEVELS[0].level).toBe(1)
    expect(SEED_LEVELS[0].xpRequired).toBe(0)
    for (let i = 1; i < SEED_LEVELS.length; i++) {
      expect(SEED_LEVELS[i].level).toBe(SEED_LEVELS[i - 1].level + 1)
      expect(SEED_LEVELS[i].xpRequired).toBeGreaterThan(
        SEED_LEVELS[i - 1].xpRequired,
      )
    }
  })
})
