import { describe, expect, it } from 'vitest'
import {
  buildFocusPlan,
  endFocusSession,
  focusResult,
  focusScore,
  formatClock,
  normalizeFocusConfig,
  pauseFocusSession,
  planTotals,
  reconcileFocusSession,
  resumeFocusSession,
  secondsLeftIn,
  skipFocusPhase,
  startFocusSession,
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
      startPhase: 'play',
    })
  })

  it('honors startPhase in the plan (the launcher ⇄ swap)', () => {
    const plan = buildFocusPlan({
      playMinutes: 25,
      learnMinutes: 5,
      rounds: 1,
      startPhase: 'learn',
    })
    expect(plan.map((s) => s.phase)).toEqual(['learn', 'play'])
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

const T0 = 1_000_000
const CONFIG = { playMinutes: 25, learnMinutes: 5, rounds: 2 }

describe('startFocusSession', () => {
  it('anchors the first phase to the wall clock', () => {
    const s = startFocusSession(CONFIG, T0)
    expect(s.stepIndex).toBe(0)
    expect(s.endsAt).toBe(T0 + 1500 * 1000)
    expect(secondsLeftIn(s, T0)).toBe(1500)
    expect(secondsLeftIn(s, T0 + 60_000)).toBe(1440)
  })
})

describe('reconcileFocusSession', () => {
  it('does not advance mid-phase', () => {
    const s = startFocusSession(CONFIG, T0)
    const r = reconcileFocusSession(s, T0 + 1000)
    expect(r.done).toBe(false)
    if (!r.done) expect(r.session.stepIndex).toBe(0)
  })

  it('rolls into the next phase once one fully elapses, banking it', () => {
    const s = startFocusSession(CONFIG, T0)
    const r = reconcileFocusSession(s, T0 + 1500 * 1000)
    expect(r.done).toBe(false)
    if (!r.done) {
      expect(r.session.stepIndex).toBe(1)
      expect(r.session.donePlay).toBe(1500)
      expect(r.session.doneLearn).toBe(0)
    }
  })

  it('catches up through several phases after a long gap (reload)', () => {
    const s = startFocusSession(CONFIG, T0)
    // 25m play + 5m learn + 25m play elapsed → into the final learn phase.
    const r = reconcileFocusSession(s, T0 + (1500 + 300 + 1500) * 1000)
    expect(r.done).toBe(false)
    if (!r.done) {
      expect(r.session.stepIndex).toBe(3)
      expect(r.session.donePlay).toBe(3000)
      expect(r.session.doneLearn).toBe(300)
    }
  })

  it('finishes when the whole plan has elapsed', () => {
    const s = startFocusSession(CONFIG, T0)
    const r = reconcileFocusSession(s, T0 + 10 * 60 * 60 * 1000)
    expect(r.done).toBe(true)
    if (r.done) expect(r.tally).toEqual({ playSeconds: 3000, learnSeconds: 600 })
  })
})

describe('pause / resume', () => {
  it('freezes the remainder and resumes without losing time', () => {
    const s = startFocusSession(CONFIG, T0)
    const paused = pauseFocusSession(s, T0 + 500_000)
    expect(paused.endsAt).toBeNull()
    expect(secondsLeftIn(paused, T0 + 9_999_999)).toBe(1000) // frozen at 1000s
    // A paused session never advances, however long the gap.
    expect(reconcileFocusSession(paused, T0 + 9_999_999).done).toBe(false)
    const resumed = resumeFocusSession(paused, T0 + 600_000)
    expect(secondsLeftIn(resumed, T0 + 600_000)).toBe(1000)
  })
})

describe('skipFocusPhase', () => {
  it('banks only the elapsed time and advances', () => {
    const s = startFocusSession(CONFIG, T0)
    const r = skipFocusPhase(s, T0 + 60_000) // 60s into a 1500s play phase
    expect(r.done).toBe(false)
    if (!r.done) {
      expect(r.session.stepIndex).toBe(1)
      expect(r.session.donePlay).toBe(60)
      expect(secondsLeftIn(r.session, T0 + 60_000)).toBe(300)
    }
  })

  it('finishes when skipping the last phase', () => {
    const one = startFocusSession({ ...CONFIG, rounds: 1 }, T0)
    const afterPlay = skipFocusPhase(one, T0)
    expect(afterPlay.done).toBe(false)
    if (!afterPlay.done) {
      const end = skipFocusPhase(afterPlay.session, T0)
      expect(end.done).toBe(true)
    }
  })
})

describe('endFocusSession', () => {
  it('banks the current phase elapsed and stops', () => {
    const s = startFocusSession(CONFIG, T0)
    expect(endFocusSession(s, T0 + 120_000)).toEqual({
      playSeconds: 120,
      learnSeconds: 0,
    })
  })
})
