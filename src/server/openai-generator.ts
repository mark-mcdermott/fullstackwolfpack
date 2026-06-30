import {
  buildGenerationPrompt,
  parseGeneratedCourse,
  type GeneratedCourse,
  type GenerationInput,
  type LessonGenerator,
} from '@/core/generation'

type FetchLike = typeof fetch

// Real OpenAI-backed generator. fetchImpl is injectable so the wiring can be
// tested without a network call or a key.
export function openAiGenerator(
  apiKey: string,
  opts?: { model?: string; fetchImpl?: FetchLike },
): LessonGenerator {
  const model = opts?.model ?? 'gpt-4o-mini'
  const doFetch = opts?.fetchImpl ?? fetch

  return {
    async generate(input: GenerationInput): Promise<GeneratedCourse> {
      const res = await doFetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are a course generator. Respond with JSON only.',
            },
            { role: 'user', content: buildGenerationPrompt(input) },
          ],
        }),
      })
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      const content = data.choices?.[0]?.message?.content
      if (typeof content !== 'string') {
        throw new Error('Malformed OpenAI response')
      }
      return parseGeneratedCourse(JSON.parse(content))
    },
  }
}
