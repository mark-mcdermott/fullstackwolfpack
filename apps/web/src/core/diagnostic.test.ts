import { describe, expect, it } from 'vitest'
import {
  diagnosticSchema,
  inferDifficulty,
} from './diagnostic'

describe('inferDifficulty', () => {
  it('maps a strong score to advanced (>= 80%)', () => {
    expect(inferDifficulty(4, 4)).toBe('advanced')
    expect(inferDifficulty(4, 5)).toBe('advanced')
  })
  it('maps a middling score to intermediate (45–79%)', () => {
    expect(inferDifficulty(2, 4)).toBe('intermediate')
    expect(inferDifficulty(3, 5)).toBe('intermediate')
  })
  it('maps a weak score to beginner (< 45%)', () => {
    expect(inferDifficulty(1, 4)).toBe('beginner')
    expect(inferDifficulty(0, 4)).toBe('beginner')
  })
  it('defaults to beginner when there are no questions', () => {
    expect(inferDifficulty(0, 0)).toBe('beginner')
  })
})

describe('diagnosticSchema', () => {
  it('coerces an out-of-range correctIndex instead of rejecting', () => {
    const parsed = diagnosticSchema.parse({
      questions: [{ prompt: 'q', options: ['a', 'b'], correctIndex: -1 }],
    })
    expect(parsed.questions[0].correctIndex).toBe(0)
  })
  it('rejects a quiz with no questions', () => {
    expect(() => diagnosticSchema.parse({ questions: [] })).toThrow()
  })
})
