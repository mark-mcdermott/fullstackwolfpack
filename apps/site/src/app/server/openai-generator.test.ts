import { describe, expect, it, vi } from 'vitest'
import { openAiGenerator } from './openai-generator'

const validCourse = {
  topic: 'React',
  difficulty: 'beginner',
  lessons: [
    {
      title: 'Intro',
      estMinutes: 5,
      segments: [
        { title: 'Hello', type: 'reading', body: '# Hi', estMinutes: 2, questions: [] },
      ],
    },
  ],
}

function okResponse() {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validCourse) } }],
    }),
    { status: 200 },
  )
}

describe('openAiGenerator', () => {
  it('sends the key and parses the JSON course', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => okResponse())
    const gen = openAiGenerator('sk-test', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    const course = await gen.generate({ topic: 'React', difficulty: 'beginner' })

    expect(course.lessons).toHaveLength(1)
    const init = fetchImpl.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer sk-test')
  })

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response('nope', { status: 401 }),
    )
    const gen = openAiGenerator('bad', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await expect(
      gen.generate({ topic: 'x', difficulty: 'beginner' }),
    ).rejects.toThrow()
  })
})
