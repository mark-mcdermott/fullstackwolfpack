import type { ExerciseTest, TestOutcome } from '@/core/exercise'
import type { ExerciseRun } from './run-exercise'

// Main-thread wrapper around the Python Web Worker. Unlike the JS runner (a fresh
// worker per run), the worker is PERSISTENT so Pyodide loads only once — repeated
// "Run" clicks are fast. A run that exceeds the timeout terminates the worker
// (killing an infinite loop); the next run recreates it and reloads Pyodide.

const FIRST_RUN_TIMEOUT_MS = 20_000 // includes the one-time Pyodide download
const RUN_TIMEOUT_MS = 8_000

let worker: Worker | null = null
let loadedOnce = false

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/python-worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return worker
}

type WorkerReply =
  | { ok: true; outcomes: TestOutcome[] }
  | { ok: false; error: string }

export function runPython(
  userCode: string,
  tests: ExerciseTest[],
): Promise<ExerciseRun> {
  return new Promise((resolve) => {
    let w: Worker
    try {
      w = getWorker()
    } catch {
      resolve({ ok: false, error: 'Could not start the Python runner in this browser.' })
      return
    }

    const timer = setTimeout(
      () => {
        w.terminate()
        worker = null
        loadedOnce = false
        finish({ ok: false, error: 'Timed out — check for an infinite loop.' })
      },
      loadedOnce ? RUN_TIMEOUT_MS : FIRST_RUN_TIMEOUT_MS,
    )

    function onMessage(ev: MessageEvent<WorkerReply>) {
      loadedOnce = true
      const d = ev.data
      finish(d.ok ? { ok: true, outcomes: d.outcomes } : { ok: false, error: d.error })
    }
    function onError() {
      w.terminate()
      worker = null
      loadedOnce = false
      finish({ ok: false, error: 'The Python runner crashed.' })
    }
    function finish(run: ExerciseRun) {
      clearTimeout(timer)
      w.removeEventListener('message', onMessage as EventListener)
      w.removeEventListener('error', onError)
      resolve(run)
    }

    w.addEventListener('message', onMessage as EventListener)
    w.addEventListener('error', onError)
    w.postMessage({ userCode, tests })
  })
}
