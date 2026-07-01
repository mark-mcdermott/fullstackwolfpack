import { z } from 'zod'

// The lesson-player's data contract — pure zod, shared by the server function that
// will back `/api/me/lesson` (a `lesson` action on api/me/[action].ts) and the
// api-client that parses it, so client and server can never disagree about a shape.
// Mirrors the style of core/app-data.ts.
//
// Deliberately OMITS answer keys: a `QuestionView` carries the prompt and (for MCQ)
// the options, but never `correctIndex` / `expectedAnswer` / `explanation`. The client
// renders the question; the server grades it and returns an `AnswerFeedback`. That way
// the answers can't be read out of the page source.

export const segmentKinds = ['reading', 'code', 'practice', 'quiz'] as const
export const questionKinds = ['mcq', 'short_answer'] as const

export const questionViewSchema = z.object({
  id: z.string(),
  type: z.enum(questionKinds),
  prompt: z.string(),
  options: z.array(z.string()).optional(), // MCQ choices; absent for short_answer
})
export type QuestionView = z.infer<typeof questionViewSchema>

export const segmentViewSchema = z.object({
  id: z.string(),
  type: z.enum(segmentKinds),
  title: z.string(),
  markdown: z.string(), // the segment body (lessonSegments.content.markdown)
  estMinutes: z.number().int().positive(),
  questions: z.array(questionViewSchema).default([]),
})
export type SegmentView = z.infer<typeof segmentViewSchema>

export const lessonViewSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  topic: z.string(),
  title: z.string(),
  estMinutes: z.number().int().positive(),
  segments: z.array(segmentViewSchema).min(1),
})
export type LessonView = z.infer<typeof lessonViewSchema>

// What the answer endpoint returns after the learner submits a choice — the answer
// key (`correctIndex`) and `explanation` are revealed here, only after answering.
export const answerFeedbackSchema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  correctIndex: z.number().int().nullable(),
  explanation: z.string().nullable(),
  xp: z.number().int(),
})
export type AnswerFeedback = z.infer<typeof answerFeedbackSchema>

export function parseLessonView(raw: unknown): LessonView {
  return lessonViewSchema.parse(raw)
}

// ---- Request / response DTOs for the learning loop ----

// POST /api/me/answer
export const answerRequestSchema = z.object({
  questionId: z.string(),
  selectedIndex: z.number().int().nonnegative(),
})
export type AnswerRequest = z.infer<typeof answerRequestSchema>

// POST /api/me/complete
export const completeRequestSchema = z.object({ lessonId: z.string() })

// What `complete` returns — the server's authoritative result for the lesson.
export const lessonCompletionSchema = z.object({
  score: z.number().int(), // 0–100
  correct: z.number().int(),
  total: z.number().int(),
  xp: z.number().int(), // XP granted for finishing (completion bonus + any streak day)
})
export type LessonCompletion = z.infer<typeof lessonCompletionSchema>
