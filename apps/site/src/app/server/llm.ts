// Minimal provider transports for the tutor + grader seams. Raw `fetch` (no SDK),
// with an injectable `fetchImpl` so the wiring is testable without a network call —
// exactly like server/openai-generator.ts. Each returns the assistant's text; the
// callers (server/grader.ts, server/tutor.ts) own prompt-building and parsing.

type FetchLike = typeof fetch

export type LlmMessage = { role: 'user' | 'assistant'; content: string }

type CommonOpts = {
  model: string
  system: string
  messages: LlmMessage[]
  maxTokens?: number
  fetchImpl?: FetchLike
}

// Claude Messages API. `jsonSchema` turns on structured outputs (constrained to
// that shape); `disableThinking` keeps interactive replies snappy on models where
// adaptive thinking is otherwise on by default (e.g. Sonnet 5). Models per
// docs/education-system.md §5.5.
export async function anthropicComplete(
  apiKey: string,
  opts: CommonOpts & { jsonSchema?: object; disableThinking?: boolean },
): Promise<string> {
  const doFetch = opts.fetchImpl ?? fetch
  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: opts.messages,
  }
  if (opts.jsonSchema) {
    body.output_config = { format: { type: 'json_schema', schema: opts.jsonSchema } }
  }
  if (opts.disableThinking) body.thinking = { type: 'disabled' }

  const res = await doFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
  const data = (await res.json()) as {
    stop_reason?: string
    content?: { type: string; text?: string }[]
  }
  if (data.stop_reason === 'refusal') throw new Error('Anthropic declined the request')
  const text = data.content?.find((b) => b.type === 'text')?.text
  if (typeof text !== 'string') throw new Error('Malformed Anthropic response')
  return text
}

// OpenAI chat-completions — same shape as server/openai-generator.ts. `jsonMode`
// asks for a JSON object response (the grader then Zod-parses it).
export async function openAiComplete(
  apiKey: string,
  opts: CommonOpts & { jsonMode?: boolean },
): Promise<string> {
  const doFetch = opts.fetchImpl ?? fetch
  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 1024,
    messages: [{ role: 'system', content: opts.system }, ...opts.messages],
  }
  if (opts.jsonMode) body.response_format = { type: 'json_object' }

  const res = await doFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Malformed OpenAI response')
  return content
}
