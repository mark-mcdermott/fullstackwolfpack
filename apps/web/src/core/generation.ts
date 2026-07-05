import { z } from 'zod'

// The AI lesson-generation pipeline, defined against two seams so the
// orchestration is testable with fakes:
//   LessonGenerator — produces course content (OpenAI in prod, fake in tests)
//   CourseStore     — persists it (Drizzle in prod, in-memory in tests)

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

// ---- Validated shape of whatever the LLM returns ----

// LLMs frequently capitalize or pad enum values ("Beginner", " MCQ"). Accept
// them case-insensitively so a well-formed course isn't rejected over casing.
const lenientEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.enum(values),
  )

export const generatedQuestionSchema = z.object({
  type: lenientEnum(['mcq', 'short_answer']),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().nonnegative().optional(),
  expectedAnswer: z.string().optional(),
  explanation: z.string().optional(),
})

export const generatedSegmentSchema = z.object({
  title: z.string(),
  type: lenientEnum(['reading', 'code', 'practice', 'quiz']),
  // A quiz segment usually has no prose body — the questions carry it. Coerce a
  // missing/null/non-string body to '' so one bodyless segment can't reject an
  // otherwise-valid (paid) course.
  body: z.preprocess((v) => (typeof v === 'string' ? v : ''), z.string()),
  // Fall back to a sane length on a missing/zero/fractional estMinutes instead
  // of failing the parse.
  estMinutes: z.number().int().positive().catch(2),
  questions: z.array(generatedQuestionSchema).default([]),
})

export const generatedLessonSchema = z.object({
  title: z.string(),
  estMinutes: z.number().int().positive().catch(5),
  segments: z.array(generatedSegmentSchema).min(1),
})

export const generatedCourseSchema = z.object({
  // topic + difficulty are echoed by the LLM but never used — the pipeline
  // already knows them from the enroll input. Keep them tolerant (any string,
  // optional) so a stray value/casing can't reject an otherwise-valid course.
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  lessons: z.array(generatedLessonSchema).min(1),
})

export type GeneratedCourse = z.infer<typeof generatedCourseSchema>
export type GeneratedLesson = z.infer<typeof generatedLessonSchema>

export function parseGeneratedCourse(raw: unknown): GeneratedCourse {
  return generatedCourseSchema.parse(raw)
}

// ---- Seams ----

export type GenerationInput = { topic: string; difficulty: Difficulty }
export type EnrollInput = GenerationInput & {
  topicId: string
  ownerUserId: string
}

export interface LessonGenerator {
  generate(input: GenerationInput): Promise<GeneratedCourse>
}

export interface CourseStore {
  createCourse(input: EnrollInput): Promise<string> // returns courseId
  addLesson(
    courseId: string,
    order: number,
    lesson: GeneratedLesson,
  ): Promise<void>
  markReady(courseId: string): Promise<void>
  markFailed(courseId: string): Promise<void>
}

// Target shape for a generated course. Kept in one place so the prompt (and any
// future validation) stay in sync, and course length is tunable here. These are
// *requests* to the model, not hard schema floors — the parse stays permissive
// (min 1) so an under-delivering model never fails a user's paid generation.
export const COURSE_TARGET = {
  minLessons: 6,
  maxLessons: 8,
  minSegments: 3,
  maxSegments: 5,
  minQuizPerLesson: 2,
} as const

// Fallback ETA for the Generate-course progress bar before any timings exist.
export const DEFAULT_GENERATION_ETA_MS = 20_000

// Running-average ETA from recorded generation durations (ms). Pure so the
// server read and the client both agree; falls back when there are no samples.
export function averageEtaMs(
  durations: number[],
  fallbackMs = DEFAULT_GENERATION_ETA_MS,
): number {
  if (durations.length === 0) return fallbackMs
  return Math.round(
    durations.reduce((sum, d) => sum + d, 0) / durations.length,
  )
}

export function buildGenerationPrompt(input: GenerationInput): string {
  const t = COURSE_TARGET
  return [
    `You are an expert developer-educator. Write a ${input.difficulty}-level course on "${input.topic}" for a working developer who learns in short, focused bursts between gaming sessions.`,
    `Produce ${t.minLessons}-${t.maxLessons} lessons — never fewer than ${t.minLessons} — that build on each other, progressing from fundamentals toward genuinely advanced, practical material, each with ${t.minSegments}-${t.maxSegments} segments.`,
    'Depth is the priority — this must NOT read like flash cards or a glossary:',
    '- Open each lesson with a short hook that motivates why the concept matters or what problem it solves — never a bare dictionary definition.',
    '- Every "reading" segment must actually teach: at least 120 words (2-4 substantial paragraphs) that explain the concept, include a concrete inline example (a short code snippet or a worked scenario), and note when/why you would use it plus a common pitfall. One- or two-sentence "X is a tool that does Y" segments are unacceptable.',
    '- "code" segments must include a real, runnable, commented snippet the learner can study and modify — not pseudocode.',
    '- "practice" segments pose an applied task tied to the reading.',
    '- "quiz" segments carry a lesson check-in; give each a short one-line body introducing it, plus its questions.',
    '- Assume the reader is a developer: use correct terminology, real commands/APIs, and realistic scenarios. Honor the difficulty — go deeper and skip hand-holding for intermediate/advanced.',
    '- Set each segment estMinutes to honestly reflect its length (a 3-minute reading is several substantial paragraphs, not one line).',
    `Include at least ${t.minQuizPerLesson} quiz questions per lesson that test understanding (not recall of a single sentence), each with a brief explanation. Vary segment types across each lesson (reading, code, practice) so no lesson is all prose.`,
    'Respond with JSON only, shaped as:',
    '{ "topic", "difficulty", "lessons": [{ "title", "estMinutes", "segments": [{ "title", "type", "body", "estMinutes", "questions": [{ "type", "prompt", "options"?, "correctIndex"?, "expectedAnswer"?, "explanation"? }] }] }] }',
    'segment.type is one of: reading | code | practice | quiz. question.type is one of: mcq | short_answer. "body" is markdown.',
  ].join('\n')
}

// Orchestrates generation: create (generating) → fill lessons → ready/failed.
export async function runGeneration(
  deps: { generator: LessonGenerator; store: CourseStore },
  input: EnrollInput,
): Promise<string> {
  const courseId = await deps.store.createCourse(input)
  try {
    const course = await deps.generator.generate({
      topic: input.topic,
      difficulty: input.difficulty,
    })
    let order = 0
    for (const lesson of course.lessons) {
      await deps.store.addLesson(courseId, order++, lesson)
    }
    await deps.store.markReady(courseId)
    return courseId
  } catch (err) {
    await deps.store.markFailed(courseId)
    throw err
  }
}
