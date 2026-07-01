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
})
export type DueReview = z.infer<typeof dueReviewSchema>

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
