import { describe, expect, it } from 'vitest'
import {
  averageEtaMs,
  buildGenerationPrompt,
  lessonStructureIssues,
  lessonVocabularyIssues,
  COURSE_TARGET,
  DEFAULT_GENERATION_ETA_MS,
  parseGeneratedCourse,
  runAppend,
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
      glossary: [],
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
  it('tolerates a capitalized difficulty echoed by the LLM (unused field)', () => {
    expect(() =>
      parseGeneratedCourse({ ...validCourse, difficulty: 'Beginner' }),
    ).not.toThrow()
  })
  it('tolerates a bodyless quiz segment (coerces body to "")', () => {
    const parsed = parseGeneratedCourse({
      topic: 'React',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          estMinutes: 5,
          segments: [
            {
              title: 'Check-in',
              type: 'quiz',
              // no `body` field — the questions carry it
              estMinutes: 2,
              questions: [
                { type: 'mcq', prompt: 'q', options: ['a', 'b'], correctIndex: 0 },
              ],
            },
          ],
        },
      ],
    })
    expect(parsed.lessons[0].segments[0].body).toBe('')
  })
  it('falls back on a missing/fractional estMinutes instead of failing', () => {
    const parsed = parseGeneratedCourse({
      topic: 'React',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          // fractional lesson estMinutes → fallback
          estMinutes: 5.5,
          segments: [
            // segment with no estMinutes → fallback
            { title: 'S', type: 'reading', body: 'x', questions: [] },
          ],
        },
      ],
    })
    expect(parsed.lessons[0].estMinutes).toBe(5)
    expect(parsed.lessons[0].segments[0].estMinutes).toBe(2)
  })
  it('normalizes capitalized/padded segment + question types', () => {
    const parsed = parseGeneratedCourse({
      topic: 'React',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          estMinutes: 5,
          segments: [
            {
              title: 'S',
              type: ' Reading ',
              body: 'x',
              estMinutes: 2,
              questions: [
                { type: 'MCQ', prompt: 'q', options: ['a'], correctIndex: 0 },
              ],
            },
          ],
        },
      ],
    })
    expect(parsed.lessons[0].segments[0].type).toBe('reading')
    expect(parsed.lessons[0].segments[0].questions[0].type).toBe('mcq')
  })
  it('accepts a practice segment carrying a runnable exercise', () => {
    const parsed = parseGeneratedCourse({
      topic: 'JavaScript',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          estMinutes: 5,
          segments: [
            {
              title: 'Write double',
              type: 'practice',
              body: 'Implement double(n).',
              estMinutes: 4,
              questions: [],
              exercise: {
                prompt: 'Return n doubled.',
                starterCode: 'function double(n) {}',
                tests: [
                  { name: 'double(4)', expression: 'double(4)', expected: 8 },
                ],
                solution: 'function double(n){return n*2}',
                hint: 'multiply by 2',
              },
            },
          ],
        },
      ],
    })
    const ex = parsed.lessons[0].segments[0].exercise
    if (!ex || ex.kind === 'git') throw new Error('expected a js exercise')
    expect(ex.starterCode).toBe('function double(n) {}')
    expect(ex.tests[0].expected).toBe(8)
  })
  it('accepts a git terminal exercise (kind: git)', () => {
    const parsed = parseGeneratedCourse({
      topic: 'Git',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          estMinutes: 5,
          segments: [
            {
              title: 'S',
              type: 'practice',
              body: 'x',
              estMinutes: 3,
              questions: [],
              exercise: {
                kind: 'git',
                prompt: 'commit a file',
                goals: [{ type: 'commitCountAtLeast', count: 1 }],
                solution: ['git init', 'echo a > f', 'git add f', 'git commit -m c'],
                hint: 'h',
              },
            },
          ],
        },
      ],
    })
    const ex = parsed.lessons[0].segments[0].exercise
    if (!ex || ex.kind !== 'git') throw new Error('expected a git exercise')
    expect(ex.goals).toHaveLength(1)
    expect(ex.solution).toContain('git init')
  })
  it('drops a malformed exercise (no tests) without failing the course', () => {
    const parsed = parseGeneratedCourse({
      topic: 'JavaScript',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          estMinutes: 5,
          segments: [
            {
              title: 'S',
              type: 'practice',
              body: 'x',
              estMinutes: 2,
              questions: [],
              // empty tests → the exercise sub-schema fails → dropped to undefined
              exercise: { prompt: 'p', starterCode: 's', tests: [] },
            },
          ],
        },
      ],
    })
    expect(parsed.lessons[0].segments[0].exercise).toBeUndefined()
  })
})

describe('buildGenerationPrompt', () => {
  it('mentions the topic and difficulty', () => {
    const p = buildGenerationPrompt({ topic: 'Docker', difficulty: 'intermediate' })
    expect(p).toContain('Docker')
    expect(p).toContain('intermediate')
  })
  it('requests a substantial, multi-lesson course', () => {
    const p = buildGenerationPrompt({ topic: 'Docker', difficulty: 'beginner' })
    expect(p).toContain(`${COURSE_TARGET.minLessons}-${COURSE_TARGET.maxLessons} lessons`)
    expect(p).toContain(`${COURSE_TARGET.minQuizPerLesson} quiz questions`)
  })
  it('asks for one idea per segment and refuses unexplained concepts', () => {
    const p = buildGenerationPrompt({ topic: 'Docker', difficulty: 'beginner' })
    expect(p).toMatch(/ONE idea per segment/)
    expect(p).toMatch(/NEVER name a concept you do not then explain/)
    expect(p).toMatch(/NO forward references/)
  })

  // The regression this guards is the one that produced the thin content in the
  // first place: a word floor becomes the target the model writes to and stops
  // at. Depth has to come from each segment having a job, not from a minimum.
  it('sets no word floor — segment length follows the job', () => {
    const p = buildGenerationPrompt({ topic: 'Docker', difficulty: 'beginner' })
    expect(p).not.toMatch(/at least \d+ words/i)
    expect(p).toMatch(/Length is whatever the job takes/)
  })

  it('gives every teaching role a job', () => {
    const p = buildGenerationPrompt({ topic: 'JavaScript', difficulty: 'beginner' })
    for (const role of ['hook', 'mechanism', 'predict', 'reveal', 'derive', 'check']) {
      expect(p).toContain(`"${role}"`)
    }
    // predict must not leak its own answer, or the commitment is worthless.
    expect(p).toMatch(/Never reveal the outcome in a predict body/)
  })
  it('describes runnable exercises (starterCode + tests) for practice segments', () => {
    const p = buildGenerationPrompt({ topic: 'JavaScript', difficulty: 'beginner' })
    expect(p).toMatch(/exercise/i)
    expect(p).toContain('starterCode')
    expect(p).toContain('tests')
    // and it must still gate exercises off topics where they don't fit
    expect(p).toMatch(/omit "exercise"/i)
  })
  it('adds terminal/git exercise guidance for a git course', () => {
    const p = buildGenerationPrompt({ topic: 'Git & GitHub', difficulty: 'beginner' })
    expect(p).toMatch(/git \/ command-line course/i)
    expect(p).toContain('"kind": "git"')
    expect(p).toContain('mergedInto')
  })
  it('threads a customization request into the full-course prompt', () => {
    const p = buildGenerationPrompt({
      topic: 'JavaScript',
      difficulty: 'beginner',
      customization: 'cover IIFEs and promises',
    })
    expect(p).toContain('cover IIFEs and promises')
    expect(p).toMatch(/learner request/i)
  })
  it('switches to an append prompt when existingTitles are given', () => {
    const p = buildGenerationPrompt({
      topic: 'JavaScript',
      difficulty: 'beginner',
      customization: 'add promises',
      existingTitles: ['Variables', 'Functions'],
    })
    expect(p).toMatch(/EXTENDING/i)
    expect(p).toMatch(/NEW lessons only/i)
    expect(p).toContain('Variables')
    expect(p).toContain('Functions')
    expect(p).toContain('add promises')
    // and it must warn against repeating what's already covered
    expect(p).toMatch(/do NOT repeat/i)
  })
})

describe('averageEtaMs', () => {
  it('falls back when there are no samples', () => {
    expect(averageEtaMs([])).toBe(DEFAULT_GENERATION_ETA_MS)
    expect(averageEtaMs([], 5000)).toBe(5000)
  })
  it('rounds the mean of the samples', () => {
    expect(averageEtaMs([10_000, 20_000, 30_000])).toBe(20_000)
    expect(averageEtaMs([10_000, 15_000])).toBe(12_500)
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

describe('runAppend', () => {
  it('adds the generated lessons after the current last one, without touching course status', async () => {
    const { store, calls } = fakeStore()
    const twoLessons: GeneratedCourse = {
      lessons: [validCourse.lessons[0], validCourse.lessons[0]],
    }
    const orders: number[] = []
    store.addLesson = async (_id, order) => {
      calls.lessons++
      orders.push(order)
    }
    const generator: LessonGenerator = { generate: async () => twoLessons }
    const added = await runAppend(
      { generator, store },
      'course-1',
      { topic: 'React', difficulty: 'beginner', existingTitles: ['Intro'] },
      5,
    )
    expect(added).toBe(2)
    expect(orders).toEqual([5, 6]) // appended after the existing lessons
    expect(calls.ready).toBe(false) // append never re-marks the course
    expect(calls.failed).toBe(false)
  })
})

describe('lessonStructureIssues', () => {
  const seg = (type: string, title = type) => ({ type, title })
  const lesson = (...types: string[]) => ({
    title: 'L',
    segments: types.map((t) => seg(t)),
  })

  it('passes a well-formed lesson', () => {
    expect(
      lessonStructureIssues(
        lesson('hook', 'mechanism', 'predict', 'reveal', 'derive', 'check'),
      ),
    ).toEqual([])
  })

  // The exact shape the first regenerated closures lesson came back with: a
  // predict whose answer only existed in its question's explanation.
  it('catches a predict with no reveal after it', () => {
    const issues = lessonStructureIssues(
      lesson('hook', 'predict', 'derive', 'check'),
    )
    expect(issues.join(' ')).toMatch(/predict .* not followed by a reveal/)
  })

  it('catches a predict at the very end of a lesson', () => {
    const issues = lessonStructureIssues(lesson('hook', 'check', 'predict'))
    expect(issues.join(' ')).toMatch(/end of lesson/)
  })

  it('catches a reveal with nothing committed to before it', () => {
    const issues = lessonStructureIssues(
      lesson('hook', 'mechanism', 'reveal', 'check'),
    )
    expect(issues.join(' ')).toMatch(/no predict before it/)
  })

  it('catches a lesson that opens cold or never checks', () => {
    expect(lessonStructureIssues(lesson('mechanism')).join(' ')).toMatch(
      /no hook/,
    )
    expect(lessonStructureIssues(lesson('mechanism')).join(' ')).toMatch(
      /no check/,
    )
  })
})

describe('lessonVocabularyIssues', () => {
  const lesson = (markdown: string) => ({
    title: 'Closures',
    segments: [{ title: 'Where it lives', markdown }],
  })

  // The audit that motivated this: the generated lessons said "box" 38 times
  // and "frame" zero, the authored lesson the exact reverse. Same machine, two
  // metaphors, and nothing anywhere saying they were the same thing.
  it('flags the soft synonym the generator kept inventing', () => {
    const issues = lessonVocabularyIssues(lesson('The box named `x` is kept alive.'))
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('box')
    expect(issues[0]).toContain('slot')
  })

  it('counts repeats so a whole lesson written in the wrong vocabulary stands out', () => {
    const issues = lessonVocabularyIssues(
      lesson('A box holds a value. Each box has a name. Boxes disappear.'),
    )
    expect(issues[0]).toContain('3×')
  })

  // Not style — this one is factually wrong, and wrong in a way that costs the
  // reader later when they learn the collector relocates heap values.
  it('flags "memory address", which is false for a JS variable', () => {
    const issues = lessonVocabularyIssues(
      lesson('The closure stores the memory address of `i`.'),
    )
    expect(issues[0]).toContain('reference')
  })

  // The first version of this check fired on every course and was wrong nearly
  // everywhere: an S3 bucket, a search box, a Windows box and the CSS box model
  // are all real terms. Scoping it is what keeps the true positives credible.
  it('stays out of topics that do not teach the execution model', () => {
    expect(lessonVocabularyIssues(lesson('Upload it to the box.'), 'aws')).toEqual([])
    expect(
      lessonVocabularyIssues(lesson('A search box that debounces.'), 'react'),
    ).toEqual([])
    expect(
      lessonVocabularyIssues(lesson('Confirm the box model.'), 'tailwind'),
    ).toEqual([])
  })

  it('passes prose written in the real vocabulary', () => {
    expect(
      lessonVocabularyIssues(
        lesson(
          'The call gets a frame on the call stack; `i` is a slot in it, and the ' +
            'function holds a reference to that slot, which is why the value lives on the heap.',
        ),
      ),
    ).toEqual([])
  })
})
