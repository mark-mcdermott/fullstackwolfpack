import { describe, expect, it } from 'vitest'
import type { RecentLesson, TopicProgress } from '@/core/app-data'
import { pickContinueSlug, topicCoursePath } from './open-course'

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

const topic = (over: Partial<TopicProgress>): TopicProgress => ({
  slug: 'react',
  name: 'React',
  category: 'frontend',
  difficulty: 'beginner',
  pct: 0,
  lessonsCompleted: 0,
  lessonsTotal: 6,
  ...over,
})

const recent = (over: Partial<RecentLesson>): RecentLesson => ({
  lessonId: 'l1',
  title: 'Intro',
  topic: 'React',
  minutes: 5,
  score: null,
  status: 'completed',
  ...over,
})

describe('pickContinueSlug', () => {
  it('returns null when no topic has a course yet', () => {
    expect(pickContinueSlug([topic({ lessonsTotal: 0 })], [])).toBeNull()
    expect(pickContinueSlug([], [])).toBeNull()
  })

  it('resumes the most recently active course (recency wins over order)', () => {
    const focus = [
      topic({ slug: 'react', name: 'React', lessonsCompleted: 1 }),
      topic({ slug: 'docker', name: 'Docker', lessonsCompleted: 2 }),
    ]
    // newest recent lesson is Docker → its slug, despite React coming first
    const recents = [recent({ topic: 'Docker' }), recent({ topic: 'React' })]
    expect(pickContinueSlug(focus, recents)).toBe('docker')
  })

  it('falls back to an in-progress course when no recent lesson maps', () => {
    const focus = [
      topic({ slug: 'react', name: 'React', lessonsCompleted: 0 }),
      topic({ slug: 'docker', name: 'Docker', lessonsCompleted: 3 }),
    ]
    expect(pickContinueSlug(focus, [])).toBe('docker')
  })

  it('falls back to the first active course when none is in progress', () => {
    const focus = [
      topic({ slug: 'react', name: 'React', lessonsCompleted: 0 }),
      topic({ slug: 'docker', name: 'Docker', lessonsCompleted: 0 }),
    ]
    expect(pickContinueSlug(focus, [])).toBe('react')
  })

  it('ignores a recent lesson whose topic has no active course', () => {
    const focus = [topic({ slug: 'react', name: 'React', lessonsCompleted: 1 })]
    // recent points at a topic not in focus → skip it, use in-progress fallback
    expect(pickContinueSlug(focus, [recent({ topic: 'Vim' })])).toBe('react')
  })
})
