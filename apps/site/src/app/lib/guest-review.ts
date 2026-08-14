import { api } from '@/api-client'
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
// It needs no endpoint of its own for the *scheduling*. The scheduler is pure,
// so it runs here; and checking an answer without shipping the answer key
// already has a public route in `/api/me/public-grade`. So a guest review is
// the existing public grade plus a local reschedule.
//
// What is stored is only the schedule. The question itself is fetched at review
// time (`/api/me/public-reviews`), the same rows the account queue reads out of
// the database — a guest simply asks by the ids it holds. It used to snapshot
// the prompt and options at answer time to save the round trip, and that traded
// one request for a copy that could never be corrected: a card seeded before a
// question gained a field, or before its course was regenerated, kept showing
// whatever was cached the day it was created. That is how review cards ended up
// asking about a code block they could not show.
//
// Device-local and losable by design, exactly like guest progress — a queue of
// cards coming due is the honest reason to make an account, rather than a wall
// in front of the thing they were already doing.

const KEY = 'fw-guest-review'

// Cards written before the store slimmed down also carry `prompt`/`options`.
// Nothing reads them and they are dropped on the next write, so there is no
// migration: an old card is a valid card that happens to be carrying luggage.
type StoredCard = { card: ReviewCard }

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

// The question ids due at `now`, soonest-first and capped the way the account
// queue is.
const DUE_LIMIT = 30

function dueIds(all: GuestReviews, now: Date): string[] {
  return dueQueue(
    Object.entries(all).map(([questionId, stored]) => ({
      questionId,
      due: stored.card.due,
    })),
    now,
  )
    .slice(0, DUE_LIMIT)
    .map((e) => e.questionId)
}

// Record a first answer as a review card. Mirrors the server's
// `seedReviewCard`, including its onConflictDoNothing: the first encounter
// creates the card and later answers to the same question in the lesson player
// don't reset the schedule out from under it.
export function seedGuestReviewCard(
  questionId: string,
  correct: boolean,
  now: Date = new Date(),
): void {
  const all = read()
  if (all[questionId]) return
  const { card } = schedule(newCard(now), ratingFromQuiz(correct), now)
  all[questionId] = { card }
  write(all)
}

// How many cards are due right now. Split out from the queue below because the
// nav badge wants this on a timer and only needs the number — reading it must
// stay a free, synchronous localStorage read.
export function guestDueCount(now: Date = new Date()): number {
  return dueIds(read(), now).length
}

// The guest's due queue, soonest-first — the same shape the account endpoint
// returns, so one page renders both. `cardId` is the question id here: the
// guest has no card rows, and it is what the public grade route needs anyway.
//
// A card whose question no longer exists (or was never built-in) is dropped
// rather than rendered blank, matching the account queue.
export async function guestReviewQueue(
  now: Date = new Date(),
): Promise<ReviewQueue> {
  const ids = dueIds(read(), now)
  const questions = await api.public.reviewQuestions(ids)
  const byId = new Map(questions.map((q) => [q.id, q]))

  const reviews: DueReview[] = ids.flatMap((id) => {
    const q = byId.get(id)
    if (!q) return []
    return [
      {
        cardId: id,
        itemType: 'quiz_question' as const,
        itemId: id,
        prompt: q.prompt,
        options: q.options,
        context: q.context,
      },
    ]
  })
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
  const rating = ratingFromQuiz(correct)
  // Answering something that was never seeded (a cleared store, a stale tab):
  // treat it as a first encounter rather than throwing.
  const { card } = schedule(all[questionId]?.card ?? newCard(now), rating, now)
  all[questionId] = { card }
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

// The stored cards flattened for the signup migration — the wire shape the
// import endpoint takes, which is the card plus the question it belongs to.
export function guestReviewEntries(): (ReviewCard & { questionId: string })[] {
  return Object.entries(read()).map(([questionId, stored]) => ({
    questionId,
    ...stored.card,
  }))
}

export function clearGuestReviews(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
