import { gradeMcqAnswer } from '@/core/learning'
import {
  type AnswerFeedback,
  type LessonView,
  parseLessonView,
} from '@/core/lesson-view'

// A hand-written sample lesson so the player renders before the `lesson` action on
// api/me/[action].ts exists. Shaped exactly like the LessonView that endpoint will
// return, so swapping `loadSampleLesson` for `api.data.lesson(id)` is a one-line change.

export const sampleLesson: LessonView = parseLessonView({
  lessonId: 'demo',
  courseId: 'demo-course',
  topic: 'JavaScript',
  title: 'Async / Await',
  estMinutes: 6,
  segments: [
    {
      id: 'seg-intro',
      type: 'reading',
      title: 'Why async?',
      estMinutes: 2,
      questions: [],
      markdown: [
        '# Async / Await',
        '',
        'JavaScript is single-threaded, so slow work (network, disk, timers) must not',
        'block the one thread. `async`/`await` lets you **write asynchronous code that',
        'reads top-to-bottom**, without nesting callbacks or chaining `.then()`.',
        '',
        '- An `async` function always returns a **promise**.',
        '- `await` unwraps a promise to its resolved value.',
        '- A rejected promise becomes a thrown error at the `await`.',
      ].join('\n'),
    },
    {
      id: 'seg-code',
      type: 'code',
      title: 'await in practice',
      estMinutes: 2,
      questions: [],
      markdown: [
        'Awaiting a promise reads like synchronous code — but the function yields to',
        'the event loop at each `await`:',
        '',
        '```ts',
        'async function loadItem(id: string) {',
        '  const res = await fetch(`/api/items/${id}`)',
        '  if (!res.ok) throw new Error(res.statusText)',
        '  return res.json()',
        '}',
        '```',
        '',
        'Wrap the `await` in `try/catch` to handle a rejection:',
        '',
        '```ts',
        'try {',
        '  const item = await loadItem("42")',
        '} catch (err) {',
        '  console.error("load failed", err)',
        '}',
        '```',
      ].join('\n'),
    },
    {
      id: 'seg-quiz',
      type: 'quiz',
      title: 'Check yourself',
      estMinutes: 2,
      markdown: 'Two quick questions before you head back to the game.',
      questions: [
        {
          id: 'q-await',
          type: 'mcq',
          prompt: 'What does `await` do inside an async function?',
          options: [
            'Blocks the entire thread until the promise settles',
            'Suspends just this function until the promise settles',
            'Cancels the promise if it takes too long',
          ],
        },
        {
          id: 'q-reject',
          type: 'mcq',
          prompt: 'How do you handle a rejected awaited promise?',
          options: [
            'Wrap the await in try/catch',
            'A rejected promise cannot be caught',
            'Only .then() can handle it, never await',
          ],
        },
      ],
    },
  ],
})

// The answer key lives OUTSIDE the LessonView — the real client never receives it, the
// server holds it. Here it stands in for the server so the demo can grade locally.
const ANSWER_KEY: Record<string, { correctIndex: number; explanation: string }> = {
  'q-await': {
    correctIndex: 1,
    explanation:
      '`await` suspends only the current async function; the event loop keeps running, so the thread is never blocked.',
  },
  'q-reject': {
    correctIndex: 0,
    explanation:
      'A rejected awaited promise throws at the await, so a surrounding try/catch handles it just like a synchronous error.',
  },
}

// Simulates `GET /api/me/lesson?id=…` — async to mirror the real api.data.lesson().
export async function loadSampleLesson(_lessonId: string): Promise<LessonView> {
  return sampleLesson
}

// Simulates `POST /api/me/answer` — grades an MCQ with the pure learning-loop math and
// returns the same AnswerFeedback shape the endpoint will.
export async function gradeSampleAnswer(
  questionId: string,
  selectedIndex: number,
): Promise<AnswerFeedback> {
  const key = ANSWER_KEY[questionId]
  if (!key) {
    return {
      questionId, correct: false, correctIndex: null,
      explanation: null, feedback: null, score: null, xp: 0,
    }
  }
  const { correct, xp } = gradeMcqAnswer(key.correctIndex, selectedIndex)
  return {
    questionId,
    correct,
    correctIndex: key.correctIndex,
    explanation: key.explanation,
    feedback: null,
    score: null,
    xp,
  }
}
