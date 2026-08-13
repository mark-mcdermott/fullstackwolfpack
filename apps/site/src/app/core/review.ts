// Pure spaced-repetition scheduling. No DOM, no DB — unit-tested directly and shared by
// the server (which persists the card) and the client (which renders the review queue),
// exactly like the other pure helpers in `core/`.
//
// This is the *seam* the review system slots into. It ships a dependency-free SM-2
// implementation as a baseline; swapping the body for `ts-fsrs` (FSRS-6) in production is
// a drop-in change behind the same surface (`newCard`/`schedule`/`isDue`/`dueQueue`).
// See docs/education-system.md §4.1.

// The four grades a learner gives a review, matching the standard Again/Hard/Good/Easy UI.
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

// The persisted per-user-per-item memory state — one of these becomes a `review_cards`
// row. FSRS would carry `stability`/`difficulty` here instead of `interval`/`efactor`;
// the surface stays the same.
export type ReviewCard = {
  interval: number // days until the next review
  repetitions: number // consecutive successful reviews (the current streak)
  efactor: number // SM-2 ease factor (>= 1.3)
  reps: number // total reviews ever
  lapses: number // total failures ever
  due: string // ISO timestamp of the next review
  lastReviewedAt: string | null
}

// An append-only audit row — one of these becomes a `review_logs` row.
export type ReviewLog = {
  rating: ReviewRating
  interval: number
  efactor: number
  reviewedAt: string
}

const MIN_EFACTOR = 1.3
const DEFAULT_EFACTOR = 2.5
const DAY_MS = 24 * 60 * 60 * 1000
// How soon a missed card comes back — short enough to land in the same sitting.
const RELEARN_MS = 10 * 60 * 1000

// SM-2 quality grade (0–5) for each button. Anything < 3 is a lapse.
const GRADE: Record<ReviewRating, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
}

// A fresh, never-seen card — immediately due.
export function newCard(now: Date = new Date()): ReviewCard {
  return {
    interval: 0,
    repetitions: 0,
    efactor: DEFAULT_EFACTOR,
    reps: 0,
    lapses: 0,
    due: now.toISOString(),
    lastReviewedAt: null,
  }
}

// The workhorse: given a card and the learner's rating, return the next card + a log row.
// Pure and deterministic in (card, rating, now).
export function schedule(
  card: ReviewCard,
  rating: ReviewRating,
  now: Date = new Date(),
): { card: ReviewCard; log: ReviewLog } {
  const q = GRADE[rating]
  const passed = q >= 3

  let { interval, repetitions, efactor, reps, lapses } = card

  if (passed) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * efactor)
    repetitions += 1
  } else {
    repetitions = 0
    // A missed card comes back in the same sitting, not tomorrow.
    //
    // Textbook SM-2 resets to a 1-day interval, and that is what this did — so
    // a wrong answer and a correct first answer scheduled identically, and the
    // one thing a learner most needs to see again was the thing they had to
    // wait a day for. Every practical implementation (Anki, FSRS) uses short
    // relearning steps instead, and it matters most for someone who has just
    // started: with a one-day floor, a first session can only ever end with an
    // empty review queue, which reads as the feature being broken.
    //
    // `interval` stays in whole days because the column is an integer — 0 means
    // "sooner than a day". The exact moment lives in `due`, which is a real
    // timestamp, so this needs no migration and no change to isDue/dueQueue.
    // Nothing multiplies by `interval` while it is 0: the next pass has
    // repetitions === 0, which assigns 1 outright.
    interval = 0
    lapses += 1
  }

  // SM-2 ease-factor update, clamped so a hard card can't spiral below 1.3.
  efactor = Math.max(
    MIN_EFACTOR,
    efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  reps += 1
  const reviewedAt = now.toISOString()
  const due = new Date(
    now.getTime() + (interval === 0 ? RELEARN_MS : interval * DAY_MS),
  ).toISOString()

  return {
    card: { interval, repetitions, efactor, reps, lapses, due, lastReviewedAt: reviewedAt },
    log: { rating, interval, efactor, reviewedAt },
  }
}

// Whether a card is due for review at `now`.
export function isDue(card: Pick<ReviewCard, 'due'>, now: Date = new Date()): boolean {
  return new Date(card.due).getTime() <= now.getTime()
}

// The review queue: the cards due at `now`, soonest-due first.
export function dueQueue<T extends { due: string }>(
  cards: T[],
  now: Date = new Date(),
): T[] {
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
}

// Bridge from the existing quiz flow: turn a `quiz_attempts.isCorrect` (plus optional
// response latency) into a review rating, so a review can be graded straight from a quiz
// answer without a separate capture step. See docs §4.1.
export function ratingFromQuiz(
  isCorrect: boolean,
  responseMs?: number,
): ReviewRating {
  if (!isCorrect) return 'again'
  if (responseMs !== undefined && responseMs < 5000) return 'easy'
  return 'good'
}
