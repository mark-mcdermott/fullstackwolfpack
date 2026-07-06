import type { GeneratedCourse } from '../core/generation'
import type { SeedCourse } from './seed-content'

// Maps a freshly generated course (the LLM pipeline's `GeneratedCourse`) into the
// built-in `SeedCourse` shape used by the seed runner. Pure + deterministic: ids
// are derived from the topic slug + positional indices so re-running the
// generator for a topic produces stable ids (idempotent seed, clean diffs).
export function generatedToSeedCourse(
  slug: string,
  difficulty: SeedCourse['difficulty'],
  gen: GeneratedCourse,
): SeedCourse {
  return {
    id: `builtin-${slug}`,
    topicSlug: slug,
    difficulty,
    lessons: gen.lessons.map((lesson, li) => {
      const lessonId = `builtin-${slug}-l${li + 1}`
      return {
        id: lessonId,
        title: lesson.title,
        estMinutes: lesson.estMinutes,
        // Carry the generated key-terms glossary through (omit when empty for
        // clean diffs); seed.ts writes it to lessons.glossary for linkify.
        ...(lesson.glossary.length ? { glossary: lesson.glossary } : {}),
        segments: lesson.segments.map((seg, si) => {
          const segId = `${lessonId}-s${si + 1}`
          return {
            id: segId,
            type: seg.type,
            title: seg.title,
            markdown: seg.body,
            estMinutes: seg.estMinutes,
            // Drop ungradeable short-answers (no reference the AI grades against)
            // so they never ship; MCQs and referenced short-answers are kept.
            questions: seg.questions
              .filter(
                (q) =>
                  q.type !== 'short_answer' ||
                  (typeof q.expectedAnswer === 'string' &&
                    q.expectedAnswer.trim() !== ''),
              )
              .map((q, qi) => ({
                id: `${segId}-q${qi + 1}`,
                type: q.type,
                prompt: q.prompt,
                options: q.options,
                correctIndex: q.correctIndex,
                expectedAnswer: q.expectedAnswer,
                explanation: q.explanation ?? '',
              })),
            // Carry a runnable exercise through when the generator emitted one,
            // with a stable slug-scoped id. `seed-content.test.ts` re-runs every
            // built-in exercise's solution against its tests, so a broken
            // generated exercise fails that gate before it can ship.
            ...(seg.exercise
              ? {
                  exercise: {
                    id: `${segId}-ex1`,
                    prompt: seg.exercise.prompt,
                    language: seg.exercise.language,
                    starterCode: seg.exercise.starterCode,
                    tests: seg.exercise.tests,
                    solution: seg.exercise.solution,
                    hint: seg.exercise.hint,
                  },
                }
              : {}),
          }
        }),
      }
    }),
  }
}
