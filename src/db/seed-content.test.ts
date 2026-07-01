import { describe, expect, it } from 'vitest'
import { BUILTIN_COURSES } from './seed-content'
import { SEED_TOPICS } from './seed-data'

describe('builtin courses', () => {
  it('reference real seeded topics', () => {
    const slugs = new Set(SEED_TOPICS.map((t) => t.slug))
    for (const c of BUILTIN_COURSES) expect(slugs.has(c.topicSlug)).toBe(true)
  })

  it('have globally unique ids', () => {
    const ids: string[] = []
    for (const c of BUILTIN_COURSES) {
      ids.push(c.id)
      for (const l of c.lessons) {
        ids.push(l.id)
        for (const s of l.segments) {
          ids.push(s.id)
          for (const q of s.questions) ids.push(q.id)
        }
      }
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('have at least one valid MCQ per course', () => {
    for (const c of BUILTIN_COURSES) {
      const questions = c.lessons.flatMap((l) =>
        l.segments.flatMap((s) => s.questions),
      )
      expect(questions.length).toBeGreaterThan(0)
      for (const q of questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(q.options.length)
        expect(q.explanation).toBeTruthy()
      }
    }
  })
})
