import { describe, expect, it } from 'vitest'
import {
  dueReviewSchema,
  questionContext,
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

// The bug this rule exists for: a `predict` question is asked against the code
// in its segment ("What does `console.log(tax)` do here?") and on the review
// page there is no lesson around it, so the prompt pointed at nothing.
describe('questionContext', () => {
  it('carries a segment body holding the code the prompt is about', () => {
    const body =
      '```js\nfunction addTax(price) {\n  const tax = price * 0.2;\n}\n```\n\nThe call has finished.'
    expect(questionContext(body)).toBe(body)
  })

  it('drops a body that is only a label', () => {
    // What a `check` segment carries — its question quotes its own code, so the
    // body would be noise on the card.
    expect(questionContext('Reference model check.')).toBeUndefined()
    expect(questionContext('Confirm the tool choices.')).toBeUndefined()
  })

  it('drops an empty, blank, or absent body', () => {
    expect(questionContext('')).toBeUndefined()
    expect(questionContext('   \n  ')).toBeUndefined()
    expect(questionContext(null)).toBeUndefined()
    expect(questionContext(undefined)).toBeUndefined()
  })

  it('trims, so the card does not open on blank lines', () => {
    expect(questionContext('\n\n```js\nx\n```\n\n')).toBe('```js\nx\n```')
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
