import { describe, expect, it } from 'vitest'
import { lessonViewSchema } from '@/core/lesson-view'
import { gradeSampleAnswer, loadSampleLesson, sampleLesson } from './sample-lesson'

describe('sampleLesson fixture', () => {
  it('is a valid LessonView', () => {
    expect(() => lessonViewSchema.parse(sampleLesson)).not.toThrow()
  })

  it('never exposes answer keys on its questions', () => {
    for (const seg of sampleLesson.segments) {
      for (const q of seg.questions) {
        expect('correctIndex' in q).toBe(false)
        expect('expectedAnswer' in q).toBe(false)
      }
    }
  })

  it('resolves the fixture from loadSampleLesson', async () => {
    const lesson = await loadSampleLesson('demo')
    expect(lesson.lessonId).toBe(sampleLesson.lessonId)
  })
})

describe('gradeSampleAnswer', () => {
  it('grades a correct MCQ answer and awards XP', async () => {
    const fb = await gradeSampleAnswer('q-await', 1)
    expect(fb.correct).toBe(true)
    expect(fb.correctIndex).toBe(1)
    expect(fb.xp).toBeGreaterThan(0)
  })

  it('grades a wrong answer and reveals the correct index + explanation', async () => {
    const fb = await gradeSampleAnswer('q-await', 0)
    expect(fb.correct).toBe(false)
    expect(fb.correctIndex).toBe(1)
    expect(fb.explanation).toBeTruthy()
  })

  it('treats an unknown question defensively', async () => {
    const fb = await gradeSampleAnswer('nope', 0)
    expect(fb.correct).toBe(false)
    expect(fb.correctIndex).toBeNull()
  })
})
