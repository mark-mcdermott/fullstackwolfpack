import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearGuestReviews,
  guestDueReviews,
  guestNextDueAt,
  guestReviewCardCount,
  rescheduleGuestReview,
  seedGuestReviewCard,
} from './guest-review'

const DAY = 86_400_000
const now = new Date('2026-08-11T12:00:00.000Z')
const later = (days: number) => new Date(now.getTime() + days * DAY)

describe('guest review cards', () => {
  beforeEach(() => {
    clearGuestReviews()
  })

  it('seeds a card from a first answer', () => {
    seedGuestReviewCard('q1', 'What prints?', ['a', 'b'], false, now)
    expect(guestReviewCardCount()).toBe(1)
  })

  // Mirrors the server's onConflictDoNothing: re-answering the same question
  // inside the lesson must not reset a schedule that is already running.
  it('does not re-seed a question it already holds', () => {
    seedGuestReviewCard('q1', 'What prints?', ['a', 'b'], false, now)
    const first = guestNextDueAt()
    seedGuestReviewCard('q1', 'What prints?', ['a', 'b'], true, later(2))
    expect(guestReviewCardCount()).toBe(1)
    expect(guestNextDueAt()).toBe(first)
  })

  // The finding that made the account version look broken: the scheduler's
  // shortest interval is a whole day, so nothing is ever due on the day you
  // learn it. Pinned here so a future relearning-steps change is deliberate.
  it('schedules a fresh card for tomorrow, not today', () => {
    seedGuestReviewCard('q1', 'What prints?', ['a', 'b'], false, now)
    expect(guestDueReviews(now).dueCount).toBe(0)
    expect(guestDueReviews(later(1)).dueCount).toBe(1)
  })

  it('returns due cards in the shape the page renders', () => {
    seedGuestReviewCard('q1', 'What prints?', ['a', 'b'], true, now)
    const [review] = guestDueReviews(later(1)).reviews
    expect(review).toMatchObject({
      cardId: 'q1',
      itemId: 'q1',
      itemType: 'quiz_question',
      prompt: 'What prints?',
      options: ['a', 'b'],
    })
  })

  it('orders the queue soonest-due first', () => {
    seedGuestReviewCard('q1', 'first', undefined, true, now)
    // Two correct answers push q2 out to a 6-day interval.
    seedGuestReviewCard('q2', 'second', undefined, true, now)
    rescheduleGuestReview('q2', true, later(1))
    const ids = guestDueReviews(later(30)).reviews.map((r) => r.cardId)
    expect(ids).toEqual(['q1', 'q2'])
  })

  it('pushes a card further out when answered correctly', () => {
    seedGuestReviewCard('q1', 'p', undefined, true, now)
    const before = guestNextDueAt()!
    const { nextDueAt } = rescheduleGuestReview('q1', true, later(1))
    expect(new Date(nextDueAt).getTime()).toBeGreaterThan(
      new Date(before).getTime(),
    )
  })

  it('rates a wrong answer "again"', () => {
    seedGuestReviewCard('q1', 'p', undefined, true, now)
    expect(rescheduleGuestReview('q1', false, later(1)).rating).toBe('again')
  })

  // A cleared store or a stale tab shouldn't throw mid-review.
  it('treats an unknown card as a first encounter', () => {
    const { rating } = rescheduleGuestReview('never-seen', true, now)
    expect(rating).toBe('good')
    expect(guestReviewCardCount()).toBe(1)
  })

  it('reports no next-due when there are no cards', () => {
    expect(guestNextDueAt()).toBeNull()
  })
})
