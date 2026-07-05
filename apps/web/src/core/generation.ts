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
  body: z.string(),
  estMinutes: z.number().int().positive().default(2),
  questions: z.array(generatedQuestionSchema).default([]),
})

export const generatedLessonSchema = z.object({
  title: z.string(),
  estMinutes: z.number().int().positive().default(5),
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

export function buildGenerationPrompt(input: GenerationInput): string {
  const t = COURSE_TARGET
  return [
    `Create a ${input.difficulty} course on "${input.topic}" for a developer who learns in short bursts between gaming sessions.`,
    `Make it substantial: produce ${t.minLessons}-${t.maxLessons} lessons that progress from fundamentals toward more advanced material, each with ${t.minSegments}-${t.maxSegments} segments.`,
    'Respond with JSON only, shaped as:',
    '{ "topic", "difficulty", "lessons": [{ "title", "estMinutes", "segments": [{ "title", "type", "body", "estMinutes", "questions": [{ "type", "prompt", "options"?, "correctIndex"?, "expectedAnswer"?, "explanation"? }] }] }] }',
    'segment.type is one of: reading | code | practice | quiz. question.type is one of: mcq | short_answer.',
    `Keep each segment to a few minutes. Include at least ${t.minQuizPerLesson} quiz questions per lesson, and vary segment types (reading, code, practice) so lessons are not all prose.`,
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
