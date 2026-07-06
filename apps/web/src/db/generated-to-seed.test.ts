import { describe, expect, it } from 'vitest'
import type { GeneratedCourse } from '../core/generation'
import { generatedToSeedCourse } from './generated-to-seed'

const gen: GeneratedCourse = {
  topic: 'Docker',
  difficulty: 'beginner',
  lessons: [
    {
      title: 'Containers 101',
      estMinutes: 6,
      glossary: ['container', 'image'],
      segments: [
        {
          title: 'Why containers',
          type: 'reading',
          body: 'A container bundles an app with its dependencies…',
          estMinutes: 3,
          questions: [
            {
              type: 'mcq',
              prompt: 'What does a container isolate?',
              options: ['Nothing', 'The process + its deps'],
              correctIndex: 1,
              explanation: 'It packages the app with everything it needs.',
            },
            {
              type: 'short_answer',
              prompt: 'Name one benefit of containers.',
              expectedAnswer: 'Consistency across environments',
            },
          ],
        },
      ],
    },
  ],
}

describe('generatedToSeedCourse', () => {
  const seed = generatedToSeedCourse('docker', 'beginner', gen)

  it('derives stable, slug-scoped ids from positions', () => {
    expect(seed.id).toBe('builtin-docker')
    expect(seed.lessons[0].id).toBe('builtin-docker-l1')
    expect(seed.lessons[0].segments[0].id).toBe('builtin-docker-l1-s1')
    expect(seed.lessons[0].segments[0].questions[0].id).toBe(
      'builtin-docker-l1-s1-q1',
    )
    expect(seed.lessons[0].segments[0].questions[1].id).toBe(
      'builtin-docker-l1-s1-q2',
    )
  })

  it('carries topic slug + difficulty and maps body → markdown', () => {
    expect(seed.topicSlug).toBe('docker')
    expect(seed.difficulty).toBe('beginner')
    expect(seed.lessons[0].segments[0].markdown).toBe(gen.lessons[0].segments[0].body)
  })

  it('defaults a missing explanation to an empty string', () => {
    // The short-answer question has no explanation in the source.
    expect(seed.lessons[0].segments[0].questions[1].explanation).toBe('')
  })

  it('is deterministic across runs', () => {
    expect(generatedToSeedCourse('docker', 'beginner', gen)).toEqual(seed)
  })

  it('leaves exercise undefined when the segment has none', () => {
    expect(seed.lessons[0].segments[0].exercise).toBeUndefined()
  })

  it('carries a runnable exercise through with a derived, slug-scoped id', () => {
    const withEx: GeneratedCourse = {
      topic: 'JavaScript',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'Functions',
          estMinutes: 5,
          glossary: [],
          segments: [
            {
              title: 'Write double',
              type: 'practice',
              body: 'Implement it.',
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
    }
    const ex = generatedToSeedCourse('javascript', 'beginner', withEx)
      .lessons[0].segments[0].exercise
    expect(ex?.id).toBe('builtin-javascript-l1-s1-ex1')
    expect(ex?.starterCode).toBe('function double(n) {}')
    expect(ex?.tests[0].expected).toBe(8)
    expect(ex?.solution).toBe('function double(n){return n*2}')
  })

  it('drops ungradeable short-answers (no expectedAnswer) but keeps others', () => {
    const withBad: GeneratedCourse = {
      topic: 'Docker',
      difficulty: 'beginner',
      lessons: [
        {
          title: 'L',
          estMinutes: 5,
          glossary: [],
          segments: [
            {
              title: 'Quiz',
              type: 'quiz',
              body: '',
              estMinutes: 2,
              questions: [
                { type: 'mcq', prompt: 'm', options: ['a', 'b'], correctIndex: 0 },
                { type: 'short_answer', prompt: 'no ref' }, // dropped
                { type: 'short_answer', prompt: 'has ref', expectedAnswer: 'yes' },
              ],
            },
          ],
        },
      ],
    }
    const out = generatedToSeedCourse('docker', 'beginner', withBad)
    const qs = out.lessons[0].segments[0].questions
    expect(qs).toHaveLength(2)
    expect(qs.map((q) => q.type)).toEqual(['mcq', 'short_answer'])
    // ids stay contiguous after the drop
    expect(qs.map((q) => q.id)).toEqual([
      'builtin-docker-l1-s1-q1',
      'builtin-docker-l1-s1-q2',
    ])
  })
})
