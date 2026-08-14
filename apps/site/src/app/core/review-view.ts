import { z } from 'zod'

// The review system's client data contract — pure zod, shared by the server functions
// behind `/api/me/review` and the api-client. Like lesson-view, a due review carries
// only the prompt + options; the answer key stays server-side and is revealed in the
// grade result.

export const reviewItemKinds = ['quiz_question', 'concept', 'lesson'] as const
export const reviewRatings = ['again', 'hard', 'good', 'easy'] as const

// One card due for review, ready to render.
export const dueReviewSchema = z.object({
  cardId: z.string(),
  itemType: z.enum(reviewItemKinds),
  itemId: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).optional(), // MCQ choices for quiz_question items
  // The segment body the prompt was asked against — see `questionContext`.
  context: z.string().optional(),
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
