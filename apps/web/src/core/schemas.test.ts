import { describe, expect, it } from 'vitest'
import { enrollRequest, openAiKeyRequest } from './schemas'

describe('openAiKeyRequest', () => {
  it('accepts a well-formed sk- key and trims whitespace', () => {
    const r = openAiKeyRequest.safeParse({ apiKey: `  sk-${'a'.repeat(40)}  ` })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.apiKey.startsWith('sk-')).toBe(true)
  })

  it('rejects keys that are malformed or too short', () => {
    expect(openAiKeyRequest.safeParse({ apiKey: 'nope' }).success).toBe(false)
    expect(openAiKeyRequest.safeParse({ apiKey: 'sk-short' }).success).toBe(false)
    expect(openAiKeyRequest.safeParse({ apiKey: '' }).success).toBe(false)
  })
})

describe('enrollRequest', () => {
  it('requires a slug and a valid difficulty', () => {
    expect(
      enrollRequest.safeParse({ topicSlug: 'react', difficulty: 'beginner' }).success,
    ).toBe(true)
    expect(
      enrollRequest.safeParse({ topicSlug: '', difficulty: 'beginner' }).success,
    ).toBe(false)
    expect(
      enrollRequest.safeParse({ topicSlug: 'react', difficulty: 'expert' }).success,
    ).toBe(false)
  })
})
