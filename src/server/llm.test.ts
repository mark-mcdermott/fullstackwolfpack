import { describe, expect, it, vi } from 'vitest'
import { anthropicComplete, openAiComplete } from './llm'

function anthropicOk(text: string) {
  return new Response(
    JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }),
    { status: 200 },
  )
}
function openAiOk(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
  })
}

describe('anthropicComplete', () => {
  it('sends auth + version headers and returns the text block', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => anthropicOk('hi there'))
    const out = await anthropicComplete('sk-ant-test', {
      model: 'claude-haiku-4-5',
      system: 'sys',
      messages: [{ role: 'user', content: 'q' }],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(out).toBe('hi there')
    const init = fetchImpl.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('sk-ant-test')
    expect(headers['anthropic-version']).toBe('2023-06-01')
  })

  it('adds output_config only when a json schema is given', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => anthropicOk('{}'))
    await anthropicComplete('k', {
      model: 'm', system: 's', messages: [{ role: 'user', content: 'q' }],
      jsonSchema: { type: 'object' },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    const body = JSON.parse((fetchImpl.mock.calls[0]?.[1]?.body as string) ?? '{}')
    expect(body.output_config.format.type).toBe('json_schema')
  })

  it('throws on a refusal stop_reason', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ stop_reason: 'refusal', content: [] }), { status: 200 }),
    )
    await expect(
      anthropicComplete('k', {
        model: 'm', system: 's', messages: [{ role: 'user', content: 'q' }],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow()
  })

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('no', { status: 401 }))
    await expect(
      anthropicComplete('k', {
        model: 'm', system: 's', messages: [{ role: 'user', content: 'q' }],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow()
  })
})

describe('openAiComplete', () => {
  it('sends the bearer key, prepends the system message, and returns content', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => openAiOk('answer'))
    const out = await openAiComplete('sk-test', {
      model: 'gpt-4o-mini',
      system: 'sys',
      messages: [{ role: 'user', content: 'q' }],
      jsonMode: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(out).toBe('answer')
    const init = fetchImpl.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer sk-test')
    const body = JSON.parse((init?.body as string) ?? '{}')
    expect(body.messages[0]).toEqual({ role: 'system', content: 'sys' })
    expect(body.response_format).toEqual({ type: 'json_object' })
  })

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('no', { status: 500 }))
    await expect(
      openAiComplete('k', {
        model: 'm', system: 's', messages: [{ role: 'user', content: 'q' }],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow()
  })
})
