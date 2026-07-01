import { describe, expect, it } from 'vitest'
import {
  XP,
  gradeMcqAnswer,
  isCorrectMcq,
  isLessonComplete,
  lessonScore,
  nextStreak,
  topicProgressPct,
  xpForLesson,
  xpForQuiz,
  xpForStreakDay,
} from './learning'

describe('isCorrectMcq / gradeMcqAnswer', () => {
  it('is correct only when the selected index matches', () => {
    expect(isCorrectMcq(2, 2)).toBe(true)
    expect(isCorrectMcq(2, 0)).toBe(false)
  })

  it('grades a correct answer with the correct-answer XP', () => {
    expect(gradeMcqAnswer(1, 1)).toEqual({ correct: true, xp: XP.quizCorrect })
  })

  it('grades a wrong answer as incorrect but still rewards the attempt', () => {
    expect(gradeMcqAnswer(1, 3)).toEqual({ correct: false, xp: XP.quizIncorrect })
    expect(XP.quizIncorrect).toBeLessThan(XP.quizCorrect)
  })
})

describe('lessonScore', () => {
  it('is a 0–100 percentage of correct answers', () => {
    expect(lessonScore(3, 4)).toBe(75)
    expect(lessonScore(4, 4)).toBe(100)
    expect(lessonScore(0, 4)).toBe(0)
  })
  it('is 0 (not NaN) when there are no questions', () => {
    expect(lessonScore(0, 0)).toBe(0)
  })
  it('rounds to the nearest whole percent', () => {
    expect(lessonScore(1, 3)).toBe(33)
    expect(lessonScore(2, 3)).toBe(67)
  })
})

describe('topicProgressPct', () => {
  it('is the completed/total percentage, 0–100', () => {
    expect(topicProgressPct(1, 4)).toBe(25)
    expect(topicProgressPct(0, 10)).toBe(0)
  })
  it('is 0 when the topic has no lessons yet', () => {
    expect(topicProgressPct(0, 0)).toBe(0)
  })
  it('never exceeds 100 even if completed overshoots total', () => {
    expect(topicProgressPct(5, 4)).toBe(100)
  })
})

describe('isLessonComplete', () => {
  it('is complete only when every segment is done', () => {
    expect(isLessonComplete(3, 3)).toBe(true)
    expect(isLessonComplete(4, 3)).toBe(true)
    expect(isLessonComplete(2, 3)).toBe(false)
  })
  it('is not complete for an empty lesson', () => {
    expect(isLessonComplete(0, 0)).toBe(false)
  })
})

describe('XP awards', () => {
  it('rewards a quiz by correctness', () => {
    expect(xpForQuiz(true)).toBe(XP.quizCorrect)
    expect(xpForQuiz(false)).toBe(XP.quizIncorrect)
  })

  it('adds a mastery bonus at or above the mastery score', () => {
    expect(xpForLesson(XP.masteryScore - 1)).toBe(XP.lessonBase)
    expect(xpForLesson(XP.masteryScore)).toBe(XP.lessonBase + XP.lessonMasteryBonus)
    expect(xpForLesson(100)).toBe(XP.lessonBase + XP.lessonMasteryBonus)
  })

  it('scales streak XP by day and caps it', () => {
    expect(xpForStreakDay(1)).toBe(XP.streakPerDay)
    expect(xpForStreakDay(3)).toBe(3 * XP.streakPerDay)
    expect(xpForStreakDay(XP.streakCapDays)).toBe(XP.streakCapDays * XP.streakPerDay)
    // past the cap, streak XP stops growing
    expect(xpForStreakDay(XP.streakCapDays + 5)).toBe(
      XP.streakCapDays * XP.streakPerDay,
    )
  })
})

describe('nextStreak', () => {
  const noon = (iso: string) => new Date(`${iso}T12:00:00.000Z`)

  it('starts a streak of 1 for a first-ever activity', () => {
    expect(nextStreak(null, noon('2026-06-30'), 0)).toEqual({
      streak: 1,
      isNewDay: true,
      continued: false,
    })
  })

  it('extends the streak on a consecutive calendar day', () => {
    expect(nextStreak('2026-06-29T20:00:00Z', noon('2026-06-30'), 4)).toEqual({
      streak: 5,
      isNewDay: true,
      continued: true,
    })
  })

  it('leaves the streak untouched for a second activity the same day', () => {
    expect(nextStreak('2026-06-30T06:00:00Z', noon('2026-06-30'), 5)).toEqual({
      streak: 5,
      isNewDay: false,
      continued: false,
    })
  })

  it('resets to 1 after a missed day', () => {
    expect(nextStreak('2026-06-28T12:00:00Z', noon('2026-06-30'), 9)).toEqual({
      streak: 1,
      isNewDay: true,
      continued: false,
    })
  })
})
