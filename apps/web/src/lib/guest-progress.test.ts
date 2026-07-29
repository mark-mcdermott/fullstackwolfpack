import { beforeEach, describe, expect, it } from 'vitest'
import { lessonScore, xpForLesson } from '@/core/learning'
import { PLAY_XP_DAILY_CAP } from '@/core/playtime'
import {
  clearGuestProgress,
  completeLessonGuest,
  guestCompletedLessonIds,
  guestLessonsCompleted,
  guestProgressEntries,
  guestXp,
  recordGuestPlaytime,
} from './guest-progress'

describe('guest progress (localStorage)', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(guestXp()).toBe(0)
    expect(guestLessonsCompleted()).toBe(0)
    expect(guestCompletedLessonIds().size).toBe(0)
  })

  it('banks modest play XP toward the daily cap', () => {
    expect(recordGuestPlaytime(600, '2026-07-28')).toBe(10) // 10 min → 10 XP
    expect(guestXp()).toBe(10)
    // Same day, past the cap → clamps at the daily cap.
    recordGuestPlaytime(60 * 60, '2026-07-28')
    expect(guestXp()).toBe(PLAY_XP_DAILY_CAP)
    // A new day resets the cap → more can be earned.
    expect(recordGuestPlaytime(120, '2026-07-29')).toBe(2)
    expect(guestXp()).toBe(PLAY_XP_DAILY_CAP + 2)
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

  it('exports migration entries and clears', () => {
    const a = completeLessonGuest('lesson-a', 3, 4, 2)
    const entries = guestProgressEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toEqual({ lessonId: 'lesson-a', score: a.score, xp: a.xp })
    clearGuestProgress()
    expect(guestProgressEntries()).toHaveLength(0)
    expect(guestXp()).toBe(0)
  })
})
