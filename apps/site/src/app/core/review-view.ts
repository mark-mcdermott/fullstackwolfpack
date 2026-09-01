import { z } from 'zod'
import { ratingFromQuiz, schedule } from './review'

// The review system's client data contract — pure zod, shared by the server functions
// behind `/api/me/review` and the api-client.
//
// Like lesson-view, a due card ships its MCQ key so the page can paint the verdict on
// click. It also ships the card's own scheduling state, because this page reports the
// next due date beside the verdict — without it the reader would get "Correct" now and
// "next review …" a round trip later. That state is the reader's own, the scheduler
// that consumes it (`core/review.ts`) is pure and already runs client-side for guests,
// and the server still reschedules from its own row on every grade.

export const reviewItemKinds = ['quiz_question', 'concept', 'lesson'] as const
export const reviewRatings = ['again', 'hard', 'good', 'easy'] as const

// The scheduler state a `review_cards` row holds, on the wire. Mirrors `ReviewCard` in
// core/review.ts — `schedule()` is handed one of these directly, so a drift between the
// two fails to compile at that call site rather than silently at runtime.
export const reviewCardSchema = z.object({
  interval: z.number(),
  repetitions: z.number(),
  efactor: z.number(),
  reps: z.number(),
  lapses: z.number(),
  due: z.string(),
  lastReviewedAt: z.string().nullable(),
})

// One card due for review, ready to render.
export const dueReviewSchema = z.object({
  cardId: z.string(),
  itemType: z.enum(reviewItemKinds),
  itemId: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).optional(), // MCQ choices for quiz_question items
  // The segment body the prompt was asked against — see `questionContext`.
  context: z.string().optional(),
  // The key + the scheduling needed to grade and reschedule locally (see the note at
  // the top). Optional so a queue served before this shipped still parses — the page
  // falls back to the server when either is missing.
  correctIndex: z.number().int().nullable().optional(),
  explanation: z.string().nullable().optional(),
  card: reviewCardSchema.optional(),
})
export type DueReview = z.infer<typeof dueReviewSchema>

// A question, ready to render, looked up by id — everything a due card shows
// apart from the scheduling. The account queue reads these from the cards it
// owns; a guest, who has no cards table, asks for them by the ids in its own
// localStorage. Answer keys stay out of it, exactly as above.
export const reviewQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  context: z.string().optional(),
  correctIndex: z.number().int().nullable().optional(),
  explanation: z.string().nullable().optional(),
})
export type ReviewQuestion = z.infer<typeof reviewQuestionSchema>

// GET /api/me/public-reviews?ids=…
export const reviewQuestionsSchema = z.object({
  questions: z.array(reviewQuestionSchema),
})

// The segment body a review card has to carry to stand on its own, or undefined
// when it has nothing to add.
//
// A question is written to sit under its segment, so how much of itself it
// restates depends on the segment. A `predict` question is asked *against* the
// code in the body above it and points back at it — "What does this print?",
// "What does `console.log(tax)` do here?" — so on the review page, where the
// lesson around it is gone, the prompt refers to nothing. A `check` question
// carries its own fence inside the prompt and its body is a label ("Reference
// model check."), which repeated here would be noise.
//
// The fence is what separates the two, and it is the property that matters
// rather than the segment type: a body worth carrying is one holding the code
// the prompt is about. A body of prose the prompt already restates is not.
export function questionContext(
  segmentMarkdown: string | null | undefined,
): string | undefined {
  const body = segmentMarkdown?.trim()
  return body && body.includes('```') ? body : undefined
}

// GET /api/me/review — the due queue.
export const reviewQueueSchema = z.object({
  reviews: z.array(dueReviewSchema),
  dueCount: z.number().int(),
})
export type ReviewQueue = z.infer<typeof reviewQueueSchema>

// POST /api/me/review — grade one card.
export const reviewGradeRequestSchema = z.object({
  cardId: z.string(),
  selectedIndex: z.number().int().nonnegative(),
})

// The graded result: correctness, the revealed key, the rating applied, and when the
// card is next due.
export const reviewResultSchema = z.object({
  cardId: z.string(),
  correct: z.boolean(),
  correctIndex: z.number().int().nullable(),
  explanation: z.string().nullable(),
  rating: z.enum(reviewRatings),
  nextDueAt: z.string(), // ISO timestamp
})
export type ReviewResult = z.infer<typeof reviewResultSchema>

// Grade and reschedule a due card without touching the network — the instant-feedback
// path, and the exact computation the server would have run.
//
// Returns null when the card arrived without a key or without its scheduling state, in
// which case the caller must wait for the server rather than paint a guess.
export function localReviewResult(
  review: DueReview,
  selectedIndex: number,
  now: Date = new Date(),
): ReviewResult | null {
  if (review.correctIndex == null || !review.card) return null
  const correct = selectedIndex === review.correctIndex
  const rating = ratingFromQuiz(correct)
  const { card } = schedule(review.card, rating, now)
  return {
    cardId: review.cardId,
    correct,
    correctIndex: review.correctIndex,
    explanation: review.explanation ?? null,
    rating,
    nextDueAt: card.due,
  }
}
