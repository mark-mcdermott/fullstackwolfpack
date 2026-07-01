import { describe, expect, it } from 'vitest'
import {
  deepEqual,
  parseExerciseTests,
  runTestCases,
  summarizeOutcomes,
} from './exercise'

describe('deepEqual', () => {
  it('compares primitives, arrays, and objects structurally', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual({ a: 1, b: [2] }, { b: [2], a: 1 })).toBe(true)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
  })
  it('treats NaN as equal to NaN', () => {
    expect(deepEqual(NaN, NaN)).toBe(true)
  })
})

describe('runTestCases', () => {
  const tests = [
    { name: 'adds', expression: 'add(2, 3)', expected: 5 },
    { name: 'adds negatives', expression: 'add(-1, -1)', expected: -2 },
  ]

  it('passes when the learner code is correct', () => {
    const outcomes = runTestCases('function add(a, b) { return a + b }', tests)
    expect(outcomes.every((o) => o.passed)).toBe(true)
    expect(summarizeOutcomes(outcomes).allPassed).toBe(true)
  })

  it('reports the mismatch when wrong', () => {
    const outcomes = runTestCases('function add(a, b) { return a - b }', tests)
    expect(outcomes[0].passed).toBe(false)
    expect(outcomes[0].message).toContain('Expected 5')
    expect(summarizeOutcomes(outcomes).passed).toBe(0)
  })

  it('captures runtime and syntax errors instead of throwing', () => {
    const outcomes = runTestCases('function add(a, b) { return notDefined }', tests)
    expect(outcomes[0].passed).toBe(false)
    expect(outcomes[0].message).toContain('Error:')
  })

  it('supports arrow functions and object returns', () => {
    const outcomes = runTestCases('const box = (x) => ({ value: x })', [
      { name: 'wraps', expression: 'box(7)', expected: { value: 7 } },
    ])
    expect(outcomes[0].passed).toBe(true)
  })
})

describe('parseExerciseTests', () => {
  it('parses a valid tests array', () => {
    const t = parseExerciseTests([{ name: 'a', expression: 'f()', expected: 1 }])
    expect(t).toHaveLength(1)
  })
  it('returns [] for malformed input rather than throwing', () => {
    expect(parseExerciseTests({ nope: true })).toEqual([])
    expect(parseExerciseTests(null)).toEqual([])
  })
})
