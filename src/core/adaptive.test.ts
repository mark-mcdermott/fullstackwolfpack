import { describe, expect, it } from 'vitest'
import {
  accuracyPct,
  hasMastery,
  recommendDifficulty,
  updateElo,
} from './adaptive'

describe('accuracyPct', () => {
  it('rounds to a whole percent and guards divide-by-zero', () => {
    expect(accuracyPct(9, 10)).toBe(90)
    expect(accuracyPct(0, 0)).toBe(0)
    expect(accuracyPct(2, 3)).toBe(67)
  })
})

describe('recommendDifficulty', () => {
  it('holds until there is enough recent evidence', () => {
    const r = recommendDifficulty(100, 'beginner', 2)
    expect(r.direction).toBe('hold')
  })
  it('steps up above the 85% band', () => {
    const r = recommendDifficulty(90, 'beginner', 10)
    expect(r.direction).toBe('up')
    expect(r.difficulty).toBe('intermediate')
  })
  it('steps down below the 70% band', () => {
    const r = recommendDifficulty(50, 'intermediate', 10)
    expect(r.direction).toBe('down')
    expect(r.difficulty).toBe('beginner')
  })
  it('holds in the sweet spot', () => {
    const r = recommendDifficulty(80, 'intermediate', 10)
    expect(r.direction).toBe('hold')
    expect(r.difficulty).toBe('intermediate')
  })
  it('clamps at the extremes', () => {
    expect(recommendDifficulty(95, 'advanced', 10).difficulty).toBe('advanced')
    expect(recommendDifficulty(40, 'beginner', 10).difficulty).toBe('beginner')
  })
})

describe('updateElo', () => {
  it('raises the learner and lowers the item on a correct answer', () => {
    const { learnerRating, itemRating } = updateElo(1200, 1200, true)
    expect(learnerRating).toBeGreaterThan(1200)
    expect(itemRating).toBeLessThan(1200)
  })
  it('is symmetric on an incorrect answer', () => {
    const { learnerRating, itemRating } = updateElo(1200, 1200, false)
    expect(learnerRating).toBeLessThan(1200)
    expect(itemRating).toBeGreaterThan(1200)
  })
  it('moves the learner less when they beat a much easier item', () => {
    const easy = updateElo(1600, 1000, true).learnerRating - 1600
    const hard = updateElo(1000, 1600, true).learnerRating - 1000
    expect(hard).toBeGreaterThan(easy)
  })
})

describe('hasMastery', () => {
  it('requires both the score threshold and a correct streak', () => {
    expect(hasMastery(90, 3)).toBe(true)
    expect(hasMastery(90, 2)).toBe(false) // streak too short
    expect(hasMastery(70, 5)).toBe(false) // score too low
  })
})
