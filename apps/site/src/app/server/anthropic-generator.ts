import {
  buildGenerationPrompt,
  parseGeneratedCourse,
  type GeneratedCourse,
  type GenerationInput,
  type LessonGenerator,
} from '../core/generation'
import { anthropicComplete } from './llm'

type FetchLike = typeof fetch

// Claude doesn't have OpenAI's strict json_object mode, so it may wrap the whole
// reply in a ```json fence or add a stray sentence. Unwrap only a fence that
// encloses the ENTIRE reply; otherwise take the span from the first `{` to the
// last `}` — lesson bodies contain their own ```jsx/```bash fences, so a naive
// first-fence match would grab those instead of the JSON.
function extractJson(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('```')) {
    const m = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
    if (m) return m[1].trim()
  }
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1)
  return trimmed
}

// Anthropic (Claude)-backed course generator. Same seam as openAiGenerator —
// builds the shared prompt and parses into the same GeneratedCourse — so the
// gen:builtins pipeline can swap providers. Claude is much stronger at emitting
// runnable code, which is why the built-ins use it for exercise generation.
// `maxTokens` is generous (a full course is large JSON) and defaults high;
// billed on actual output, so the ceiling costs nothing when unused. The transport
// is non-streaming raw fetch with no tight client timeout, so a large single
// generation completes without the SDK's high-max_tokens streaming requirement.
export function anthropicGenerator(
  apiKey: string,
  opts?: { model?: string; maxTokens?: number; fetchImpl?: FetchLike },
): LessonGenerator {
  const model = opts?.model ?? 'claude-opus-4-8'
  return {
    async generate(input: GenerationInput): Promise<GeneratedCourse> {
      const text = await anthropicComplete(apiKey, {
        model,
        system:
          'You are a course generator. Respond with a single JSON object and nothing else — no prose, no explanation, no markdown code fences.',
        messages: [{ role: 'user', content: buildGenerationPrompt(input) }],
        maxTokens: opts?.maxTokens ?? 32000,
        fetchImpl: opts?.fetchImpl,
      })
      return parseGeneratedCourse(JSON.parse(extractJson(text)))
    },
  }
}
