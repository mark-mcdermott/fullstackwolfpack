import type {
  ExerciseLanguage,
  ExerciseTest,
  TestOutcome,
} from '@/core/exercise'

// Main-thread wrapper around the exercise Web Worker. Spawns a fresh worker per
// run, races it against a timeout, and terminates it either way — so an infinite
// loop in the learner's code can't hang the tab. All grading happens in the worker
// via the pure core/exercise.ts. See docs/education-system.md §4.3.

export type ExerciseRun =
  | { ok: true; outcomes: TestOutcome[] }
  | { ok: false; error: string }

const TIMEOUT_MS = 3000

export function runExercise(
  userCode: string,
  tests: ExerciseTest[],
  language: ExerciseLanguage = 'js',
  timeoutMs = TIMEOUT_MS,
): Promise<ExerciseRun> {
  return new Promise((resolve) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('../workers/exercise-worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch {
      resolve({ ok: false, error: 'Could not start the code runner in this browser.' })
      return
    }

    const timer = setTimeout(() => {
      worker.terminate()
      resolve({ ok: false, error: 'Timed out — check for an infinite loop.' })
    }, timeoutMs)

    worker.onmessage = (e: MessageEvent<TestOutcome[]>) => {
      clearTimeout(timer)
      worker.terminate()
      resolve({ ok: true, outcomes: e.data })
    }
    worker.onerror = () => {
      clearTimeout(timer)
      worker.terminate()
      resolve({ ok: false, error: 'The code runner crashed.' })
    }

    worker.postMessage({ userCode, tests, language })
  })
}
