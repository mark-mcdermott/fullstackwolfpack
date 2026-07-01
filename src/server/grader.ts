import process from 'node:process'
import {
  buildGradingSystemPrompt,
  buildGradingUserPrompt,
  gradeResultSchema,
  heuristicGrade,
  GRADE_JSON_SCHEMA,
  type GradeInput,
  type GradeResult,
} from '../core/grader'
import { anthropicComplete, openAiComplete } from './llm'
import { resolveProvider } from './provider'

// Server-side short-answer grader: resolve the provider, ask the LLM to grade
// against the reference answer (structured output), and fall back to the pure
// keyword-overlap heuristic when there's no key or the call fails — so grading
// always returns something and never throws into the answer flow.
// Model per docs/education-system.md §5.5: Haiku 4.5 (cheap, high-volume).

export async function gradeAnswer(
  userId: string,
  input: GradeInput,
): Promise<GradeResult> {
  const provider = await resolveProvider(userId)
  if (!provider) return heuristicGrade(input)

  try {
    const system = buildGradingSystemPrompt()
    const messages = [{ role: 'user' as const, content: buildGradingUserPrompt(input) }]
    const raw =
      provider.provider === 'anthropic'
        ? await anthropicComplete(provider.apiKey, {
            model: process.env.ANTHROPIC_GRADER_MODEL ?? 'claude-haiku-4-5',
            system,
            messages,
            jsonSchema: GRADE_JSON_SCHEMA,
          })
        : await openAiComplete(provider.apiKey, {
            model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
            system,
            messages,
            jsonMode: true,
          })
    return gradeResultSchema.parse(JSON.parse(raw))
  } catch {
    return heuristicGrade(input) // degrade gracefully; never block the answer
  }
}
