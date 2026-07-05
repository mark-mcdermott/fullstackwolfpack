import { describe, expect, it } from 'vitest'
import { topicCoursePath } from './open-course'

describe('topicCoursePath', () => {
  it('deep-links to the topic card on the Topics page', () => {
    expect(topicCoursePath('react')).toBe('/app/topics?topic=react')
  })

  it('url-encodes slugs with special characters', () => {
    expect(topicCoursePath('git & github')).toBe(
      '/app/topics?topic=git%20%26%20github',
    )
  })
})
