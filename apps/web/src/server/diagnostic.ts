import process from 'node:process'
import {
  buildDiagnosticSystemPrompt,
  buildDiagnosticUserPrompt,
  diagnosticSchema,
  DIAGNOSTIC_JSON_SCHEMA,
  type Diagnostic,
} from '../core/diagnostic'
import { anthropicComplete, openAiComplete } from './llm'
import { resolveProvider } from './provider'

// Build a placement quiz for a topic via the shared LLM seam (Claude preferred,
// per-user key → env fallback — same resolution as the grader/tutor). Throws when
// no provider is configured; the caller surfaces that to the intake UI.
export async function generateDiagnostic(
  userId: string,
  topic: string,
): Promise<Diagnostic> {
  const provider = await resolveProvider(userId)
  if (!provider) {
    throw new Error('No AI provider configured — add a key in Settings.')
  }
  const system = buildDiagnosticSystemPrompt()
  const messages = [
    { role: 'user' as const, content: buildDiagnosticUserPrompt(topic) },
  ]
  const raw =
    provider.provider === 'anthropic'
      ? await anthropicComplete(provider.apiKey, {
          model: process.env.ANTHROPIC_GRADER_MODEL ?? 'claude-haiku-4-5',
          system,
          messages,
          jsonSchema: DIAGNOSTIC_JSON_SCHEMA,
        })
      : await openAiComplete(provider.apiKey, {
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          system,
          messages,
          jsonMode: true,
        })
  return diagnosticSchema.parse(JSON.parse(raw))
}
