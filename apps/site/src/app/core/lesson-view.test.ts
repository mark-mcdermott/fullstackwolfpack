import { describe, expect, it } from 'vitest'
import {
  answerFeedbackSchema,
  answerRequestSchema,
  completeRequestSchema,
  lessonCompletionSchema,
  lessonViewSchema,
  parseLessonView,
  questionViewSchema,
  segmentLabel,
  isScoredSegment,
  normalizeQuestionPrompt,
  segmentKinds,
} from './lesson-view'

const validLesson = {
  lessonId: 'l1',
  courseId: 'c1',
  topic: 'JavaScript',
  topicSlug: 'javascript',
  title: 'Promises',
  estMinutes: 5,
  segments: [
    {
      id: 's1',
      type: 'reading',
      title: 'What is a Promise?',
      markdown: '# Promises\nA promise represents a future value.',
      estMinutes: 2,
      questions: [],
    },
    {
      id: 's2',
      type: 'quiz',
      title: 'Check yourself',
      markdown: 'Answer the following.',
      estMinutes: 1,
      questions: [
        { id: 'q1', type: 'mcq', prompt: 'What does a rejected promise represent?', options: ['A value', 'An error'] },
      ],
    },
  ],
}

describe('lessonViewSchema', () => {
  it('accepts a valid lesson', () => {
    expect(parseLessonView(validLesson).title).toBe('Promises')
  })

  it('rejects a lesson with no segments', () => {
    expect(() => parseLessonView({ ...validLesson, segments: [] })).toThrow()
  })

  it('defaults a segment with no questions to an empty array', () => {
    const parsed = lessonViewSchema.parse({
      ...validLesson,
      segments: [
        { id: 's1', type: 'reading', title: 't', markdown: 'x', estMinutes: 1 },
      ],
    })
    expect(parsed.segments[0].questions).toEqual([])
  })
})

describe('questionViewSchema — no answer keys leak to the client', () => {
  it('strips a correctIndex if one is (wrongly) present in the payload', () => {
    const parsed = questionViewSchema.parse({
      id: 'q1',
      type: 'mcq',
      prompt: 'pick one',
      options: ['a', 'b'],
      correctIndex: 1, // must not survive into the client-facing object
      expectedAnswer: 'b',
    })
    expect('correctIndex' in parsed).toBe(false)
    expect('expectedAnswer' in parsed).toBe(false)
  })
})

describe('answerFeedbackSchema', () => {
  it('accepts a graded MCQ result', () => {
    const fb = answerFeedbackSchema.parse({
      questionId: 'q1',
      correct: true,
      correctIndex: 1,
      explanation: 'A rejected promise carries an error.',
      xp: 10,
    })
    expect(fb.correct).toBe(true)
    expect(fb.xp).toBe(10)
  })

  it('allows a null correctIndex/explanation (e.g. short-answer)', () => {
    const fb = answerFeedbackSchema.parse({
      questionId: 'q2',
      correct: false,
      correctIndex: null,
      explanation: null,
      xp: 2,
    })
    expect(fb.correctIndex).toBeNull()
  })
})

describe('learning-loop request/response DTOs', () => {
  it('accepts a valid answer request', () => {
    expect(answerRequestSchema.parse({ questionId: 'q1', selectedIndex: 0 })).toEqual({
      questionId: 'q1',
      selectedIndex: 0,
    })
  })

  it('rejects a negative selected index', () => {
    expect(() =>
      answerRequestSchema.parse({ questionId: 'q1', selectedIndex: -1 }),
    ).toThrow()
  })

  it('requires a lessonId to complete', () => {
    expect(completeRequestSchema.parse({ lessonId: 'l1' }).lessonId).toBe('l1')
    expect(() => completeRequestSchema.parse({})).toThrow()
  })

  it('accepts a lesson completion result', () => {
    const c = lessonCompletionSchema.parse({
      score: 80,
      correct: 4,
      total: 5,
      xp: 65,
    })
    expect(c.score).toBe(80)
  })
})

describe('segmentLabel', () => {
  // The generator's vocabulary describes the job a segment does — right in a
  // prompt, wrong on a badge a learner reads mid-lesson.
  it('translates the teaching roles into learner-facing words', () => {
    expect(segmentLabel('mechanism')).toBe('Concept')
    expect(segmentLabel('derive')).toBe('Practice')
    expect(segmentLabel('reveal')).toBe('Answer')
    expect(segmentLabel('hook')).toBe('Setup')
  })

  it('covers every kind the schema allows, so nothing leaks raw', () => {
    for (const kind of segmentKinds) {
      expect(segmentLabel(kind)).not.toBe(kind === 'quiz' ? 'quiz' : kind)
    }
  })

  it('falls back to the raw kind rather than blanking on something unknown', () => {
    expect(segmentLabel('something-new')).toBe('something-new')
  })
})

describe('isScoredSegment', () => {
  // The rule that keeps the predict/reveal pair honest. A predict is written to
  // be answered wrong — its reveal is required to name the wrong answer — so
  // grading it would punish the commitment the format runs on and reward
  // skipping ahead to read the reveal first.
  it('excludes predict, so an honest wrong guess costs nothing', () => {
    expect(isScoredSegment('predict')).toBe(false)
  })

  it('scores everything that actually tests the idea', () => {
    for (const kind of segmentKinds) {
      if (kind === 'predict') continue
      expect(isScoredSegment(kind)).toBe(true)
    }
  })

  // Stated as an exclusion on purpose: a role added later grades by default
  // rather than silently vanishing from every learner's score.
  it('scores an unknown kind by default', () => {
    expect(isScoredSegment('something-new')).toBe(true)
  })
})

describe('normalizeQuestionPrompt', () => {
  it('puts an inline fence on its own lines so it renders as code', () => {
    const out = normalizeQuestionPrompt(
      'What does this print? ```js function f() { var a = 1 } f() ```',
    )
    expect(out).toContain('\n```js\nfunction f() { var a = 1 } f()\n```')
    expect(out.startsWith('What does this print?')).toBe(true)
  })

  it('leaves a well-formed fence alone, so it is safe to always apply', () => {
    const already = 'Trace it:\n\n```js\nconst a = 1\nconsole.log(a)\n```\n'
    expect(normalizeQuestionPrompt(already)).toBe(already)
  })

  it('is idempotent — normalizing twice changes nothing', () => {
    const once = normalizeQuestionPrompt('Print? ```js f() ```')
    expect(normalizeQuestionPrompt(once)).toBe(once)
  })

  it('leaves inline code spans untouched', () => {
    const p = 'Why does `let z` throw but `var z` not?'
    expect(normalizeQuestionPrompt(p)).toBe(p)
  })
})
