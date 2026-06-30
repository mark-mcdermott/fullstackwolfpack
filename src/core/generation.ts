import { z } from 'zod'

// The AI lesson-generation pipeline, defined against two seams so the
// orchestration is testable with fakes:
//   LessonGenerator — produces course content (OpenAI in prod, fake in tests)
//   CourseStore     — persists it (Drizzle in prod, in-memory in tests)

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

// ---- Validated shape of whatever the LLM returns ----

export const generatedQuestionSchema = z.object({
  type: z.enum(['mcq', 'short_answer']),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().nonnegative().optional(),
  expectedAnswer: z.string().optional(),
  explanation: z.string().optional(),
})

export const generatedSegmentSchema = z.object({
  title: z.string(),
  type: z.enum(['reading', 'code', 'practice', 'quiz']),
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
  topic: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
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

export function buildGenerationPrompt(input: GenerationInput): string {
  return [
    `Create a ${input.difficulty} course on "${input.topic}" for a developer who learns in short bursts between gaming sessions.`,
    'Respond with JSON only, shaped as:',
    '{ "topic", "difficulty", "lessons": [{ "title", "estMinutes", "segments": [{ "title", "type", "body", "estMinutes", "questions": [{ "type", "prompt", "options"?, "correctIndex"?, "expectedAnswer"?, "explanation"? }] }] }] }',
    'segment.type is one of: reading | code | practice | quiz. question.type is one of: mcq | short_answer.',
    'Keep each segment to a few minutes. Include at least one quiz question per lesson.',
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
