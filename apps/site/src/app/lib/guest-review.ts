import {
  type ReviewCard,
  type ReviewRating,
  dueQueue,
  newCard,
  ratingFromQuiz,
  schedule,
} from '@/core/review'
import type { DueReview, ReviewQueue } from '@/core/review-view'

// Guest (no-login) spaced repetition, mirrored in localStorage — the sibling of
// guest-progress.ts, and built the same way: the SAME pure core/review scheduler
// the server uses, so a guest's intervals match what they would get signed in.
//
// It needs no endpoint of its own. The scheduler is pure, so it runs here; and
// the one thing that genuinely cannot happen on the client — checking the answer
// without shipping the answer key — already has a public route in
// `/api/me/public-grade`. So a guest review is the existing public grade plus a
// local reschedule.
//
// The card carries its own prompt and options. The account queue re-reads those
// from the database at review time, which a guest cannot do; but the guest has
// already seen the question, so storing it when they answer costs nothing and
// keeps the review self-contained.
//
// Device-local and losable by design, exactly like guest progress — a queue of
// cards coming due is the honest reason to make an account, rather than a wall
// in front of the thing they were already doing.

const KEY = 'fw-guest-review'

type StoredCard = {
  card: ReviewCard
  prompt: string
  options?: string[]
}

type GuestReviews = Record<string, StoredCard> // questionId → card

function read(): GuestReviews {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as GuestReviews
  } catch {
    return {}
  }
}

function write(r: GuestReviews): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* storage full / disabled — reviews just aren't saved */
  }
}

// Record a first answer as a review card. Mirrors the server's
// `seedReviewCard`, including its onConflictDoNothing: the first encounter
// creates the card and later answers to the same question in the lesson player
// don't reset the schedule out from under it.
export function seedGuestReviewCard(
  questionId: string,
  prompt: string,
  options: string[] | undefined,
  correct: boolean,
  now: Date = new Date(),
): void {
  const all = read()
  if (all[questionId]) return
  const { card } = schedule(newCard(now), ratingFromQuiz(correct), now)
  all[questionId] = { card, prompt, options }
  write(all)
}

// The guest's due queue, soonest-first — the same shape the account endpoint
// returns, so one page renders both. `cardId` is the question id here: the
// guest has no card rows, and it is what the public grade route needs anyway.
export function guestDueReviews(now: Date = new Date()): ReviewQueue {
  const all = read()
  const entries = Object.entries(all).map(([questionId, stored]) => ({
    questionId,
    ...stored,
  }))
  const due = dueQueue(
    entries.map((e) => ({ ...e, due: e.card.due })),
    now,
  )
  const reviews: DueReview[] = due.map((e) => ({
    cardId: e.questionId,
    itemType: 'quiz_question' as const,
    itemId: e.questionId,
    prompt: e.prompt,
    options: e.options,
  }))
  return { reviews, dueCount: reviews.length }
}

// Reschedule a card after the guest answers it. Returns when it next comes due,
// so the UI can say so — the account path gets the same from the server.
export function rescheduleGuestReview(
  questionId: string,
  correct: boolean,
  now: Date = new Date(),
): { rating: ReviewRating; nextDueAt: string } {
  const all = read()
  const stored = all[questionId]
  const rating = ratingFromQuiz(correct)
  // Answering something that was never seeded (a cleared store, a stale tab):
  // treat it as a first encounter rather than throwing.
  const base = stored?.card ?? newCard(now)
  const { card } = schedule(base, rating, now)
  all[questionId] = {
    card,
    prompt: stored?.prompt ?? '',
    options: stored?.options,
  }
  write(all)
  return { rating, nextDueAt: card.due }
}

// How many cards exist at all, due or not — the "6 cards waiting" number worth
// showing a guest who is deciding whether to make an account.
export function guestReviewCardCount(): number {
  return Object.keys(read()).length
}

// When the next card comes due, or null if there are none. Lets an empty queue
// say "nothing due until tomorrow" instead of implying there is nothing there.
export function guestNextDueAt(): string | null {
  const cards = Object.values(read())
  if (cards.length === 0) return null
  return cards.reduce(
    (soonest, c) => (c.card.due < soonest ? c.card.due : soonest),
    cards[0].card.due,
  )
}

export function clearGuestReviews(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
