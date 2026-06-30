import { describe, expect, it } from 'vitest'
import {
  buildGenerationPrompt,
  parseGeneratedCourse,
  runGeneration,
  type CourseStore,
  type GeneratedCourse,
  type LessonGenerator,
} from './generation'

const validCourse: GeneratedCourse = {
  topic: 'React',
  difficulty: 'beginner',
  lessons: [
    {
      title: 'Intro',
      estMinutes: 5,
      segments: [
        {
          title: 'Hello',
          type: 'reading',
          body: '# Hi',
          estMinutes: 2,
          questions: [],
        },
      ],
    },
  ],
}

describe('parseGeneratedCourse', () => {
  it('accepts a valid course', () => {
    expect(parseGeneratedCourse(validCourse).topic).toBe('React')
  })
  it('rejects a course with no lessons', () => {
    expect(() => parseGeneratedCourse({ ...validCourse, lessons: [] })).toThrow()
  })
  it('rejects a lesson with no segments', () => {
    expect(() =>
      parseGeneratedCourse({
        topic: 'x',
        difficulty: 'beginner',
        lessons: [{ title: 'l', estMinutes: 5, segments: [] }],
      }),
    ).toThrow()
  })
})

describe('buildGenerationPrompt', () => {
  it('mentions the topic and difficulty', () => {
    const p = buildGenerationPrompt({ topic: 'Docker', difficulty: 'intermediate' })
    expect(p).toContain('Docker')
    expect(p).toContain('intermediate')
  })
})

function fakeStore() {
  const calls = { lessons: 0, ready: false, failed: false }
  const store: CourseStore = {
    createCourse: async () => 'course-1',
    addLesson: async () => {
      calls.lessons++
    },
    markReady: async () => {
      calls.ready = true
    },
    markFailed: async () => {
      calls.failed = true
    },
  }
  return { store, calls }
}

const enroll = {
  topic: 'React',
  topicId: 't1',
  difficulty: 'beginner',
  ownerUserId: 'u1',
} as const

describe('runGeneration', () => {
  it('persists each lesson and marks the course ready', async () => {
    const { store, calls } = fakeStore()
    const generator: LessonGenerator = { generate: async () => validCourse }
    const id = await runGeneration({ generator, store }, enroll)
    expect(id).toBe('course-1')
    expect(calls.lessons).toBe(1)
    expect(calls.ready).toBe(true)
    expect(calls.failed).toBe(false)
  })

  it('marks the course failed when the generator throws', async () => {
    const { store, calls } = fakeStore()
    const generator: LessonGenerator = {
      generate: async () => {
        throw new Error('LLM down')
      },
    }
    await expect(runGeneration({ generator, store }, enroll)).rejects.toThrow(
      'LLM down',
    )
    expect(calls.failed).toBe(true)
    expect(calls.ready).toBe(false)
  })
})
