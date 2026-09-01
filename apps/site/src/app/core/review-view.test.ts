import { describe, expect, it } from 'vitest'
import { ratingFromQuiz, schedule } from './review'
import {
  type DueReview,
  dueReviewSchema,
  localReviewResult,
  questionContext,
  reviewGradeRequestSchema,
  reviewQueueSchema,
  reviewResultSchema,
} from './review-view'

// A card mid-schedule rather than a fresh one, so a wrong reschedule can't coincide
// with the defaults and pass anyway.
const card = {
  interval: 6,
  repetitions: 2,
  efactor: 2.5,
  reps: 2,
  lapses: 0,
  due: '2026-01-01T00:00:00.000Z',
  lastReviewedAt: '2025-12-26T00:00:00.000Z',
}

describe('dueReviewSchema', () => {
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

  // The key now ships on purpose — the page paints the verdict from it, and the
  // server still reschedules the card from its own row on every grade.
  it('carries the key and the card when they are sent', () => {
    const r = dueReviewSchema.parse({
      cardId: 'c1',
      itemType: 'quiz_question',
      itemId: 'q1',
      prompt: 'x',
      options: ['a', 'b'],
      correctIndex: 1,
      card,
    })
    expect(r.correctIndex).toBe(1)
    expect(r.card?.efactor).toBe(2.5)
  })
})

describe('localReviewResult', () => {
  const review: DueReview = {
    cardId: 'c1',
    itemType: 'quiz_question',
    itemId: 'q1',
    prompt: 'What does await do?',
    options: ['nothing', 'unwraps a promise'],
    correctIndex: 1,
    explanation: 'It suspends until the promise settles.',
    card,
  }

  it('grades and reschedules without the network', () => {
    const r = localReviewResult(review, 1, new Date('2026-01-01T00:00:00Z'))
    expect(r).toMatchObject({
      cardId: 'c1',
      correct: true,
      correctIndex: 1,
      explanation: 'It suspends until the promise settles.',
      rating: 'good',
    })
  })

  // The whole reason the card ships: the page prints the next due date beside the
  // verdict, so a local grade has to produce one the server would agree with.
  it('reschedules exactly as the server would', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const r = localReviewResult(review, 1, now)
    const { card: expected } = schedule(card, ratingFromQuiz(true), now)
    expect(r?.nextDueAt).toBe(expected.due)
  })

  it('rates a miss as `again`, which brings it back this sitting', () => {
    expect(localReviewResult(review, 0, new Date())?.rating).toBe('again')
  })

  it('returns a result the wire contract accepts', () => {
    expect(reviewResultSchema.safeParse(localReviewResult(review, 1)).success).toBe(true)
  })

  // Either half missing means the page must wait for the server instead of guessing.
  it('declines a card with no key', () => {
    expect(localReviewResult({ ...review, correctIndex: null }, 1)).toBeNull()
  })

  it('declines a card with no schedule', () => {
    expect(localReviewResult({ ...review, card: undefined }, 1)).toBeNull()
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
