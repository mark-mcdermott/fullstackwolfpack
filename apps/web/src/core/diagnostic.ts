import { z } from 'zod'
import type { Difficulty } from './generation'

// A short AI-generated placement quiz for the pre-generation intake: it sets a
// topic's starting difficulty when the user opts into "gauge my skill level".
// Graded client-side — it's a no-stakes self-placement, so answers can ship.

export const DIAGNOSTIC_QUESTION_COUNT = 4

export const diagnosticQuestionSchema = z.object({
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  // Tolerate a stray/out-of-range index rather than reject the whole quiz.
  correctIndex: z.number().int().nonnegative().catch(0),
})
export const diagnosticSchema = z.object({
  questions: z.array(diagnosticQuestionSchema).min(1),
})
export type Diagnostic = z.infer<typeof diagnosticSchema>
export type DiagnosticQuestion = z.infer<typeof diagnosticQuestionSchema>

// Structured-output schema for Claude (openAiComplete uses plain json mode).
export const DIAGNOSTIC_JSON_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
        },
        required: ['prompt', 'options', 'correctIndex'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
} as const

export function buildDiagnosticSystemPrompt(): string {
  return 'You write short multiple-choice placement quizzes for developers. Respond with JSON only.'
}

export function buildDiagnosticUserPrompt(topic: string): string {
  return [
    `Write a ${DIAGNOSTIC_QUESTION_COUNT}-question multiple-choice placement quiz for "${topic}" to gauge a working developer's current level.`,
    'Order the questions from fundamentals to genuinely advanced. Give each 3-4 plausible options and exactly one correct answer (correctIndex is 0-based).',
    'Respond with JSON only: { "questions": [{ "prompt", "options", "correctIndex" }] }.',
  ].join('\n')
}

// Map a placement score to a starting difficulty. Pure + unit-tested.
export function inferDifficulty(correct: number, total: number): Difficulty {
  if (total <= 0) return 'beginner'
  const ratio = correct / total
  if (ratio >= 0.8) return 'advanced'
  if (ratio >= 0.45) return 'intermediate'
  return 'beginner'
}
