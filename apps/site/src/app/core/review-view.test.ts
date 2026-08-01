import { describe, expect, it } from 'vitest'
import {
  dueReviewSchema,
  reviewGradeRequestSchema,
  reviewQueueSchema,
  reviewResultSchema,
} from './review-view'

describe('dueReviewSchema — no answer keys', () => {
  it('accepts a due MCQ review with prompt + options', () => {
    const r = dueReviewSchema.parse({
      cardId: 'c1',
      itemType: 'quiz_question',
      itemId: 'q1',
      prompt: 'What does await do?',
      options: ['a', 'b'],
    })
    expect(r.itemId).toBe('q1')
  })

  it('strips a correctIndex if it leaks into the payload', () => {
    const r = dueReviewSchema.parse({
      cardId: 'c1',
      itemType: 'quiz_question',
      itemId: 'q1',
      prompt: 'x',
      options: ['a', 'b'],
      correctIndex: 1,
    })
    expect('correctIndex' in r).toBe(false)
  })
})

describe('reviewQueueSchema', () => {
  it('accepts an empty queue', () => {
    expect(reviewQueueSchema.parse({ reviews: [], dueCount: 0 }).dueCount).toBe(0)
  })
})

describe('reviewGradeRequestSchema', () => {
  it('requires a cardId and a non-negative index', () => {
    expect(
      reviewGradeRequestSchema.parse({ cardId: 'c1', selectedIndex: 0 }).cardId,
    ).toBe('c1')
    expect(() =>
      reviewGradeRequestSchema.parse({ cardId: 'c1', selectedIndex: -1 }),
    ).toThrow()
  })
})

describe('reviewResultSchema', () => {
  it('accepts a graded review result', () => {
    const res = reviewResultSchema.parse({
      cardId: 'c1',
      correct: true,
      correctIndex: 1,
      explanation: 'because',
      rating: 'good',
      nextDueAt: '2026-07-01T00:00:00.000Z',
    })
    expect(res.rating).toBe('good')
  })

  it('rejects an unknown rating', () => {
    expect(() =>
      reviewResultSchema.parse({
        cardId: 'c1',
        correct: false,
        correctIndex: null,
        explanation: null,
        rating: 'sometimes',
        nextDueAt: '2026-07-01T00:00:00.000Z',
      }),
    ).toThrow()
  })
})
