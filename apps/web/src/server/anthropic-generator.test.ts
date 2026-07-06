import { describe, expect, it } from 'vitest'
import type { GenerationInput } from '../core/generation'
import { anthropicGenerator } from './anthropic-generator'

// A fake fetch returning a Claude Messages-API-shaped reply whose text is `body`.
function fakeFetch(body: string): typeof fetch {
  return (async () => ({
    ok: true,
    json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: body }] }),
  })) as unknown as typeof fetch
}

// A course whose reading body contains its own ```jsx fence — the case that broke
// a naive first-fence extractor.
const course = {
  topic: 'JS',
  difficulty: 'beginner',
  lessons: [
    {
      title: 'Closures',
      estMinutes: 5,
      glossary: ['closure'],
      segments: [
        {
          title: 'What is a closure',
          type: 'reading',
          body: 'A closure captures state:\n```jsx\nconst f = () => 1\n```',
          estMinutes: 2,
          questions: [],
        },
      ],
    },
  ],
}
const json = JSON.stringify(course)
const input: GenerationInput = { topic: 'JS', difficulty: 'beginner' }

describe('anthropicGenerator', () => {
  it('parses a raw JSON reply', async () => {
    const gen = anthropicGenerator('k', { fetchImpl: fakeFetch(json) })
    expect((await gen.generate(input)).lessons[0].glossary).toEqual(['closure'])
  })

  it('unwraps a reply fully enclosed in a ```json fence', async () => {
    const gen = anthropicGenerator('k', {
      fetchImpl: fakeFetch('```json\n' + json + '\n```'),
    })
    expect((await gen.generate(input)).lessons).toHaveLength(1)
  })

  it('ignores ```jsx fences inside lesson bodies (brace-span, not first fence)', async () => {
    const gen = anthropicGenerator('k', {
      fetchImpl: fakeFetch('Here is the course:\n' + json),
    })
    const out = await gen.generate(input)
    expect(out.lessons[0].segments[0].body).toContain('```jsx')
  })
})
