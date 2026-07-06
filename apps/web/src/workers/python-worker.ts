import type { ExerciseTest } from '@/core/exercise'
import { runPythonTests, type PyodideLike } from '@/core/python-runner'

// Runs Python exercises off the main thread. Pyodide (CPython→WASM, ~6MB) is loaded
// lazily from the CDN — the version is pinned to the `pyodide` npm package used by
// the Node ship gate, so the browser and the gate run identical Python. Cached for
// the worker's lifetime; lib/run-python.ts terminates + recreates the worker on a
// timeout (killing an infinite loop, at the cost of one reload).
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v314.0.2/full/'

let pyodidePromise: Promise<PyodideLike> | null = null
function getPyodide(): Promise<PyodideLike> {
  if (!pyodidePromise) {
    pyodidePromise = import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`).then(
      (m: { loadPyodide: (o: { indexURL: string }) => Promise<PyodideLike> }) =>
        m.loadPyodide({ indexURL: PYODIDE_BASE }),
    )
  }
  return pyodidePromise
}

type Incoming = { userCode: string; tests: ExerciseTest[] }
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<Incoming>) => void) | null
  postMessage: (msg: unknown) => void
}

ctx.onmessage = async (e) => {
  try {
    const pyodide = await getPyodide()
    ctx.postMessage({
      ok: true,
      outcomes: runPythonTests(pyodide, e.data.userCode, e.data.tests),
    })
  } catch {
    ctx.postMessage({ ok: false, error: 'Could not start the Python runtime.' })
  }
}
