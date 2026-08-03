import { describe, expect, it } from 'vitest'
import { EMBLEM_PALETTE, EMBLEM_SLUGS, GRID, pixelEmblem } from './badge-pixel-art'

// The 12 achievement slugs (core/achievements.ts) — every one needs bespoke art.
const BADGE_SLUGS = [
  'week-warrior',
  'focus-mode',
  'typescript-novice',
  'hot-streak',
  'learning-machine',
  'bug-hunter',
  'cli-commander',
  'early-bird',
  'quiz-master',
  'legend',
  'perfectionist',
  'master-wolf',
]

describe('badge pixel art', () => {
  it('every badge slug has a bespoke emblem', () => {
    for (const slug of BADGE_SLUGS) {
      expect(EMBLEM_SLUGS, slug).toContain(slug)
    }
  })

  it('every emblem is a GRID×GRID bitmap of known palette chars', () => {
    for (const slug of EMBLEM_SLUGS) {
      const rows = pixelEmblem(slug)
      expect(rows, slug).toHaveLength(GRID)
      for (const row of rows) {
        expect(row.length, `${slug} row width`).toBe(GRID)
        for (const ch of row) {
          if (ch === '.') continue
          expect(EMBLEM_PALETTE[ch], `${slug} uses unknown '${ch}'`).toBeTruthy()
        }
      }
    }
  })
})
