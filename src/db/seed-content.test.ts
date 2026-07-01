import { describe, expect, it } from 'vitest'
import { runTestCases, summarizeOutcomes } from '../core/exercise'
import { BUILTIN_COURSES } from './seed-content'
import { SEED_TOPICS } from './seed-data'

describe('builtin courses', () => {
  it('reference real seeded topics', () => {
    const slugs = new Set(SEED_TOPICS.map((t) => t.slug))
    for (const c of BUILTIN_COURSES) expect(slugs.has(c.topicSlug)).toBe(true)
  })

  it('have globally unique ids (courses, lessons, segments, questions, exercises)', () => {
    const ids: string[] = []
    for (const c of BUILTIN_COURSES) {
      ids.push(c.id)
      for (const l of c.lessons) {
        ids.push(l.id)
        for (const s of l.segments) {
          ids.push(s.id)
          for (const q of s.questions) ids.push(q.id)
          if (s.exercise) ids.push(s.exercise.id)
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
      const mcqs = questions.filter((q) => (q.type ?? 'mcq') === 'mcq')
      expect(mcqs.length).toBeGreaterThan(0)
      for (const q of mcqs) {
        expect(q.options?.length ?? 0).toBeGreaterThanOrEqual(2)
        expect(q.correctIndex ?? -1).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex ?? Infinity).toBeLessThan(q.options?.length ?? 0)
        expect(q.explanation).toBeTruthy()
      }
    }
  })

  it('short-answer questions carry a reference answer', () => {
    const short = BUILTIN_COURSES.flatMap((c) =>
      c.lessons.flatMap((l) =>
        l.segments.flatMap((s) => s.questions.filter((q) => q.type === 'short_answer')),
      ),
    )
    for (const q of short) expect(q.expectedAnswer).toBeTruthy()
  })

  it('every exercise solution passes its own tests', () => {
    const exs = BUILTIN_COURSES.flatMap((c) =>
      c.lessons.flatMap((l) =>
        l.segments.flatMap((s) => (s.exercise ? [s.exercise] : [])),
      ),
    )
    for (const ex of exs) {
      expect(ex.tests.length).toBeGreaterThan(0)
      expect(ex.starterCode).toBeTruthy()
      const outcomes = runTestCases(ex.solution, ex.tests)
      expect(summarizeOutcomes(outcomes).allPassed).toBe(true)
    }
  })
})
