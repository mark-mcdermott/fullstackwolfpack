import { describe, expect, it } from 'vitest'
import {
  buildTutorSystemPrompt,
  tutorRequestSchema,
  type TutorContext,
} from './tutor'

const ctx: TutorContext = {
  topic: 'JavaScript',
  lessonTitle: 'Closures',
  segmentTitle: 'Capturing scope',
  segmentMarkdown: 'A **closure** remembers the variables around it.',
}

describe('buildTutorSystemPrompt', () => {
  it('injects the on-screen segment for grounding', () => {
    const sys = buildTutorSystemPrompt(ctx, 'chat')
    expect(sys).toContain('A **closure** remembers the variables around it.')
    expect(sys).toContain('JavaScript')
    expect(sys).toContain('Closures')
  })

  it('varies the guidance by mode', () => {
    expect(buildTutorSystemPrompt(ctx, 'hint')).toContain('ONE small hint')
    expect(buildTutorSystemPrompt(ctx, 'why_wrong')).toContain('wrong')
    expect(buildTutorSystemPrompt(ctx, 'example')).toContain('example')
  })
})

describe('tutorRequestSchema', () => {
  it('defaults mode to chat and requires at least one message', () => {
    const parsed = tutorRequestSchema.parse({
      segmentId: 's1',
      messages: [{ role: 'user', content: 'help' }],
    })
    expect(parsed.mode).toBe('chat')
  })
  it('rejects an empty conversation', () => {
    expect(() =>
      tutorRequestSchema.parse({ segmentId: 's1', messages: [] }),
    ).toThrow()
  })
})
