import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearGuestReviews,
  guestDueCount,
  guestNextDueAt,
  guestReviewCardCount,
  guestReviewEntries,
  guestReviewQueue,
  rescheduleGuestReview,
  seedGuestReviewCard,
} from './guest-review'

const DAY = 86_400_000
const now = new Date('2026-08-11T12:00:00.000Z')
const later = (days: number) => new Date(now.getTime() + days * DAY)

// The queue looks its questions up over the public route (a guest stores only
// the schedule), so the fetch stands in for the server.
const reviewQuestions = vi.hoisted(() => vi.fn())
vi.mock('@/api-client', () => ({ api: { public: { reviewQuestions } } }))

function serverHas(...questions: { id: string; prompt: string; context?: string }[]) {
  reviewQuestions.mockImplementation(async (ids: string[]) =>
    questions.filter((q) => ids.includes(q.id)),
  )
}

describe('guest review cards', () => {
  beforeEach(() => {
    clearGuestReviews()
    reviewQuestions.mockReset()
    serverHas({ id: 'q1', prompt: 'What prints?' }, { id: 'q2', prompt: 'second' })
  })

  it('seeds a card from a first answer', () => {
    seedGuestReviewCard('q1', false, now)
    expect(guestReviewCardCount()).toBe(1)
  })

  // Mirrors the server's onConflictDoNothing: re-answering the same question
  // inside the lesson must not reset a schedule that is already running.
  it('does not re-seed a question it already holds', () => {
    seedGuestReviewCard('q1', false, now)
    const first = guestNextDueAt()
    seedGuestReviewCard('q1', true, later(2))
    expect(guestReviewCardCount()).toBe(1)
    expect(guestNextDueAt()).toBe(first)
  })

  // A first answer that was CORRECT waits a day — you don't need to re-see
  // what you just got right.
  it('schedules a correct first answer for tomorrow, not today', () => {
    seedGuestReviewCard('q1', true, now)
    expect(guestDueCount(now)).toBe(0)
    expect(guestDueCount(later(1))).toBe(1)
  })

  // A WRONG one comes back inside the session. This is what makes the queue
  // non-empty for a guest on their first visit — with a one-day floor, a first
  // session could only ever end with "nothing due".
  it('brings a missed question back within the same session', () => {
    seedGuestReviewCard('q1', false, now)
    const inTenMinutes = new Date(now.getTime() + 10 * 60_000)
    expect(guestDueCount(now)).toBe(0)
    expect(guestDueCount(inTenMinutes)).toBe(1)
  })

  it('returns due cards in the shape the page renders', async () => {
    serverHas({ id: 'q1', prompt: 'What prints?' })
    reviewQuestions.mockImplementation(async () => [
      { id: 'q1', prompt: 'What prints?', options: ['a', 'b'] },
    ])
    seedGuestReviewCard('q1', true, now)
    const [review] = (await guestReviewQueue(later(1))).reviews
    expect(review).toMatchObject({
      cardId: 'q1',
      itemId: 'q1',
      itemType: 'quiz_question',
      prompt: 'What prints?',
      options: ['a', 'b'],
    })
  })

  // The bug this hydration exists for: the store used to snapshot the prompt at
  // answer time, so a card seeded before the question's code block was carried
  // could never show it. Reading through to the server fixes the cards already
  // sitting in a guest's localStorage, with no migration — they hold the id,
  // which is all the lookup needs.
  it('renders the code a stored card never saw', async () => {
    const context = '```js\nconst tax = 2;\n```'
    seedGuestReviewCard('q1', true, now)
    serverHas({ id: 'q1', prompt: 'What does `tax` hold here?', context })
    const [review] = (await guestReviewQueue(later(1))).reviews
    expect(review.context).toBe(context)
    expect(review.prompt).toBe('What does `tax` hold here?')
  })

  // A regenerated catalogue drops question rows. The account queue skips a card
  // whose question is gone rather than rendering it blank; so does this one.
  it('drops a card whose question no longer exists', async () => {
    seedGuestReviewCard('q1', true, now)
    seedGuestReviewCard('q2', true, now)
    serverHas({ id: 'q2', prompt: 'second' })
    const queue = await guestReviewQueue(later(1))
    expect(queue.reviews.map((r) => r.cardId)).toEqual(['q2'])
    expect(queue.dueCount).toBe(1)
  })

  it('orders the queue soonest-due first', async () => {
    seedGuestReviewCard('q1', true, now)
    // Two correct answers push q2 out to a 6-day interval.
    seedGuestReviewCard('q2', true, now)
    rescheduleGuestReview('q2', true, later(1))
    const ids = (await guestReviewQueue(later(30))).reviews.map((r) => r.cardId)
    expect(ids).toEqual(['q1', 'q2'])
  })

  it('pushes a card further out when answered correctly', () => {
    seedGuestReviewCard('q1', true, now)
    const before = guestNextDueAt()!
    const { nextDueAt } = rescheduleGuestReview('q1', true, later(1))
    expect(new Date(nextDueAt).getTime()).toBeGreaterThan(
      new Date(before).getTime(),
    )
  })

  it('rates a wrong answer "again"', () => {
    seedGuestReviewCard('q1', true, now)
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

  // The signup handoff. Without it, making an account emptied the queue the
  // guest had just built — the opposite of the reason to make one.
  describe('signup migration', () => {
    it('flattens each card to the wire shape the import takes', () => {
      seedGuestReviewCard('q1', false, now)
      const [entry] = guestReviewEntries()
      expect(entry).toMatchObject({ questionId: 'q1', repetitions: 0, lapses: 1 })
      expect(typeof entry.due).toBe('string')
      expect(entry.efactor).toBeGreaterThanOrEqual(1.3)
    })

    it('hands over every card, due or not', async () => {
      seedGuestReviewCard('q1', false, now) // due in minutes
      seedGuestReviewCard('q2', true, now) // due tomorrow
      expect(guestReviewEntries()).toHaveLength(2)
      expect(guestDueCount(now)).toBe(0)
    })

    it('is empty when there is nothing to migrate', () => {
      expect(guestReviewEntries()).toEqual([])
    })
  })

  // Old cards carry `prompt`/`options` alongside the schedule. Nothing reads
  // them any more, but they must not stop the card being scheduled or rendered.
  it('reads a card written by the pre-hydration store', async () => {
    localStorage.setItem(
      'fw-guest-review',
      JSON.stringify({
        q1: {
          card: {
            interval: 1,
            repetitions: 1,
            efactor: 2.5,
            reps: 1,
            lapses: 0,
            due: now.toISOString(),
            lastReviewedAt: null,
          },
          prompt: 'a stale copy of the question',
          options: ['a', 'b'],
        },
      }),
    )
    serverHas({ id: 'q1', prompt: 'the current question' })
    const [review] = (await guestReviewQueue(later(1))).reviews
    expect(review.prompt).toBe('the current question')
  })
})
