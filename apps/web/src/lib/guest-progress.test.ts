import { beforeEach, describe, expect, it } from 'vitest'
import { lessonScore, xpForLesson } from '@/core/learning'
import {
  completeLessonGuest,
  guestCompletedLessonIds,
  guestLessonsCompleted,
  guestXp,
} from './guest-progress'

describe('guest progress (localStorage)', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(guestXp()).toBe(0)
    expect(guestLessonsCompleted()).toBe(0)
    expect(guestCompletedLessonIds().size).toBe(0)
  })

  it('records a completion with the same math as the server', () => {
    const result = completeLessonGuest('lesson-a', 3, 4, 5)
    const expectedScore = lessonScore(3, 4)
    expect(result.score).toBe(expectedScore)
    expect(result.xp).toBe(5 + xpForLesson(expectedScore))
    expect(guestXp()).toBe(result.xp)
    expect(guestCompletedLessonIds().has('lesson-a')).toBe(true)
  })

  it('is idempotent — re-completing a lesson does not double XP', () => {
    const first = completeLessonGuest('lesson-a', 4, 4, 2)
    completeLessonGuest('lesson-a', 4, 4, 2)
    expect(guestXp()).toBe(first.xp)
    expect(guestLessonsCompleted()).toBe(1)
  })

  it('accumulates across distinct lessons', () => {
    const a = completeLessonGuest('lesson-a', 2, 4, 1)
    const b = completeLessonGuest('lesson-b', 4, 4, 3)
    expect(guestLessonsCompleted()).toBe(2)
    expect(guestXp()).toBe(a.xp + b.xp)
  })
})
