import { describe, expect, it } from 'vitest'
import {
  buildFocusPlan,
  focusResult,
  focusScore,
  formatClock,
  normalizeFocusConfig,
  planTotals,
  xpForFocusSession,
} from './focus-session'

describe('buildFocusPlan', () => {
  it('alternates play then learn per round', () => {
    const plan = buildFocusPlan({ playMinutes: 25, learnMinutes: 5, rounds: 2 })
    expect(plan.map((s) => s.phase)).toEqual(['play', 'learn', 'play', 'learn'])
    expect(plan[0]).toEqual({ phase: 'play', seconds: 1500 })
    expect(plan[1]).toEqual({ phase: 'learn', seconds: 300 })
  })
})

describe('normalizeFocusConfig', () => {
  it('clamps out-of-range values', () => {
    expect(normalizeFocusConfig({ playMinutes: 0, learnMinutes: 999, rounds: 50 })).toEqual({
      playMinutes: 1,
      learnMinutes: 60,
      rounds: 8,
    })
  })
})

describe('planTotals', () => {
  it('sums play and learn seconds', () => {
    const totals = planTotals(buildFocusPlan({ playMinutes: 25, learnMinutes: 5, rounds: 2 }))
    expect(totals).toEqual({ playSeconds: 3000, learnSeconds: 600, totalSeconds: 3600 })
  })
})

describe('focusScore', () => {
  it('is the percentage of the plan completed', () => {
    expect(focusScore(3600, 3600)).toBe(100)
    expect(focusScore(3600, 1800)).toBe(50)
    expect(focusScore(3600, 0)).toBe(0)
  })
  it('never exceeds 100 or drops below 0', () => {
    expect(focusScore(100, 200)).toBe(100)
    expect(focusScore(0, 100)).toBe(0)
  })
})

describe('focusResult', () => {
  it('records completed minutes, intervals and a full score', () => {
    const result = focusResult({ playMinutes: 25, learnMinutes: 5, rounds: 1 }, 1500, 300)
    expect(result).toEqual({
      playMinutes: 25,
      learnMinutes: 5,
      playIntervalMin: 25,
      learnIntervalMin: 5,
      focusScore: 100,
    })
  })
  it('scores an early exit below 100', () => {
    // Finished the 25m play but bailed on the 5m learn.
    const result = focusResult({ playMinutes: 25, learnMinutes: 5, rounds: 1 }, 1500, 0)
    expect(result.learnMinutes).toBe(0)
    expect(result.focusScore).toBe(83) // 1500 / 1800
  })
})

describe('xpForFocusSession', () => {
  it('rewards a full session with base + per-learn-minute', () => {
    // base 20 (score 100) + 5 learn * 4 = 40
    expect(xpForFocusSession({ learnMinutes: 5, focusScore: 100 })).toBe(40)
  })
  it('scales the base by completion and grants nothing for an instant bail', () => {
    expect(xpForFocusSession({ learnMinutes: 0, focusScore: 0 })).toBe(0)
    // base 20 * 0.5 rounded + 0 learn = 10
    expect(xpForFocusSession({ learnMinutes: 0, focusScore: 50 })).toBe(10)
  })
})

describe('formatClock', () => {
  it('formats m:ss and floors negatives to 0:00', () => {
    expect(formatClock(90)).toBe('1:30')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(-3)).toBe('0:00')
  })
})
