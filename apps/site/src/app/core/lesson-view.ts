import { z } from 'zod'
import { exerciseTestSchema } from './exercise'
import { gitGoalSchema } from './git-sim'
import { gradeMcqAnswer } from './learning'

// The lesson-player's data contract — pure zod, shared by the server function that
// will back `/api/me/lesson` (a `lesson` action on api/me/[action].ts) and the
// api-client that parses it, so client and server can never disagree about a shape.
// Mirrors the style of core/app-data.ts.
//
// Answer keys are split by what grading a question actually costs. An MCQ key
// (`correctIndex` + `explanation`) ships with the question so the player can paint the
// verdict on click instead of waiting out a round trip. A short_answer's
// `expectedAnswer` never ships: it is read by a model server-side, so there is nothing
// the client could do with it except leak it.
//
// Shipping the MCQ key costs no integrity, because painting and scoring are separate
// jobs. The attempt is still POSTed, and the server regrades from its own row to write
// `quiz_attempts` / `users.xp`; the leaderboard ranks those numbers. A tampered client
// fools its own screen and nothing else.

// The first four are the original vocabulary, kept for content already stored
// against them; the rest are the teaching roles new lessons are built from.
// What the learner sees on a segment's badge. The kinds above are the names the
// *generator* works in — "mechanism" and "derive" describe the job a segment
// has to do, which is exactly right in a prompt and wrong on a page. A reader
// mid-lesson should be told what this screen is, not which pedagogical slot it
// fills, so the internal vocabulary stops at the badge.
const SEGMENT_LABELS: Record<string, string> = {
  hook: 'Setup',
  mechanism: 'Concept',
  predict: 'Predict',
  reveal: 'Answer',
  derive: 'Practice',
  check: 'Check',
  // The original four already read as themselves.
  reading: 'Reading',
  code: 'Code',
  practice: 'Practice',
  quiz: 'Quiz',
}

export function segmentLabel(kind: string): string {
  return SEGMENT_LABELS[kind] ?? kind
}

export const segmentKinds = [
  'reading',
  'code',
  'practice',
  'quiz',
  'hook',
  'mechanism',
  'predict',
  'reveal',
  'derive',
  'check',
] as const

// Segment kinds whose questions are asked but not graded.
//
// `predict` is the whole list, and it is there by design rather than by
// leniency. A predict exists to be answered *wrong*: its paired `reveal` is
// required to name the wrong answer and say which belief to discard, so the
// format only works if the reader commits to a guess honestly. Scoring that
// guess punishes exactly that — and rewards skipping ahead to read the reveal
// first, or picking the safe-looking option — which dismantles the mechanism
// the lesson is built on. The attempt is still recorded and still earns XP; it
// just doesn't decide mastery.
//
// Stated as an exclusion so a new segment kind is scored by default.
//
// Typed as the kinds themselves rather than `string[]`, so a typo here is
// caught and so the list can be handed straight to a query against the
// `segment_type` column — as `string[]` it matched no `notInArray` overload.
export type SegmentKind = (typeof segmentKinds)[number]
export const unscoredSegmentKinds: readonly SegmentKind[] = ['predict']

// Takes a bare string, because callers have one: a segment kind off the wire or
// out of a row, not yet narrowed.
export function isScoredSegment(kind: string): boolean {
  return !unscoredSegmentKinds.some((k) => k === kind)
}

// Repair a question prompt whose code fence was written inline.
//
// Markdown only treats ``` as a fence when it sits on its own line, so a prompt
// generated as "What does this print? ```js f() ```" renders the backticks
// literally. Normalising at read time rather than regenerating keeps existing
// content correct and is idempotent: a fence that already spans lines can't
// match, because the body pattern stops at a newline.
export function normalizeQuestionPrompt(prompt: string): string {
  return prompt.replace(
    /```(\w*)[ \t]*([^\n]*?)[ \t]*```/g,
    (whole, lang: string, code: string) =>
      code.trim() === '' ? whole : `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`,
  )
}
export const questionKinds = ['mcq', 'short_answer'] as const

export const questionViewSchema = z.object({
  id: z.string(),
  type: z.enum(questionKinds),
  prompt: z.string(),
  options: z.array(z.string()).optional(), // MCQ choices; absent for short_answer
  // The MCQ answer key (see the note at the top). Optional rather than nullable-only
  // so a question serialised before this shipped still parses.
  correctIndex: z.number().int().nullable().optional(),
  explanation: z.string().nullable().optional(),
})
export type QuestionView = z.infer<typeof questionViewSchema>

// A code exercise rendered by the in-browser runner (Phase 4). `tests` and
// `solution` reach the client because they run/reveal client-side by design (this
// is practice, not a graded exam); `hint`/`solution` are shown only on request.
export const jsExerciseViewSchema = z.object({
  kind: z.literal('js'),
  id: z.string(),
  prompt: z.string(),
  starterCode: z.string(),
  // Authoring language: 'ts' type-strips to JS, 'python' runs on Pyodide.
  language: z.enum(['js', 'ts', 'python']).default('js'),
  tests: z.array(exerciseTestSchema),
  hint: z.string().nullable(),
  solution: z.string().nullable(),
})
export type JsExerciseView = z.infer<typeof jsExerciseViewSchema>

// A terminal/git exercise run against core/git-sim.ts. `goals` are the success
// criteria (checked client-side against the sim state); `solution` is the command
// sequence, `setup` pre-runs before the learner.
export const gitExerciseViewSchema = z.object({
  kind: z.literal('git'),
  id: z.string(),
  prompt: z.string(),
  setup: z.array(z.string()).default([]),
  goals: z.array(gitGoalSchema),
  solution: z.array(z.string()),
  hint: z.string().nullable(),
})
export type GitExerciseView = z.infer<typeof gitExerciseViewSchema>

export const exerciseViewSchema = z.discriminatedUnion('kind', [
  jsExerciseViewSchema,
  gitExerciseViewSchema,
])
export type ExerciseView = z.infer<typeof exerciseViewSchema>

export const segmentViewSchema = z.object({
  id: z.string(),
  type: z.enum(segmentKinds),
  title: z.string(),
  markdown: z.string(), // the segment body (lessonSegments.content.markdown)
  estMinutes: z.number().int().positive(),
  questions: z.array(questionViewSchema).default([]),
  exercise: exerciseViewSchema.nullable().default(null),
})
export type SegmentView = z.infer<typeof segmentViewSchema>

export const lessonViewSchema = z.object({
  lessonId: z.string(),
  courseId: z.string(),
  topic: z.string(),
  topicSlug: z.string(),
  title: z.string(),
  estMinutes: z.number().int().positive(),
  // Key terms for further-reading links (empty unless the course was generated
  // with a glossary and the reader opted into "hyperlink key terms").
  glossary: z.array(z.string()).default([]),
  segments: z.array(segmentViewSchema).min(1),
})
export type LessonView = z.infer<typeof lessonViewSchema>

// What the answer endpoint returns after the learner submits a choice — the answer
// key (`correctIndex`) and `explanation` are revealed here, only after answering.
// `feedback`/`score` carry the AI grade for short-answer questions (null for MCQ).
export const answerFeedbackSchema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  correctIndex: z.number().int().nullable(),
  explanation: z.string().nullable(),
  feedback: z.string().nullable().default(null), // short-answer AI feedback
  score: z.number().int().nullable().default(null), // short-answer 0–5 score
  xp: z.number().int(),
})
export type AnswerFeedback = z.infer<typeof answerFeedbackSchema>

// Grade an MCQ from the key the question already carries — the instant-feedback path.
// Returns null when there is no key to grade against (a short_answer, or an MCQ whose
// key was withheld), which is the caller's signal to wait for the server instead.
//
// The `xp` here is the same pure `xpForQuiz` the server will apply, so reconciling the
// server's reply over this one is a no-op in every normal case.
export function localMcqFeedback(
  question: QuestionView,
  selectedIndex: number,
): AnswerFeedback | null {
  if (question.type !== 'mcq' || question.correctIndex == null) return null
  const { correct, xp } = gradeMcqAnswer(question.correctIndex, selectedIndex)
  return {
    questionId: question.id,
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation ?? null,
    feedback: null,
    score: null,
    xp,
  }
}

export function parseLessonView(raw: unknown): LessonView {
  return lessonViewSchema.parse(raw)
}

// ---- Request / response DTOs for the learning loop ----

// POST /api/me/answer — MCQ sends `selectedIndex`, short-answer sends `answerText`.
export const answerRequestSchema = z
  .object({
    questionId: z.string(),
    selectedIndex: z.number().int().nonnegative().optional(),
    answerText: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((v) => v.selectedIndex !== undefined || v.answerText !== undefined, {
    message: 'Provide selectedIndex (MCQ) or answerText (short answer).',
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
