import { deepEqual, type ExerciseTest, type TestOutcome } from './exercise'

// Shared grading logic for Python exercises. The Pyodide instance (CPython→WASM)
// is supplied by the caller — loaded from a CDN in the browser worker
// (workers/python-worker.ts) and from the npm package in the Node ship gate
// (server/python-gate.ts) — so this stays environment-agnostic and unit-testable.

// The slice of the Pyodide API we use.
export type PyodideLike = {
  runPython: (code: string, options?: { globals?: unknown }) => unknown
  toPy: (obj: unknown) => unknown
}

function show(v: unknown): string {
  try {
    return typeof v === 'string' ? v : JSON.stringify(v)
  } catch {
    return String(v)
  }
}

// The last line of a Python traceback is the readable "SyntaxError: …" / "NameError: …".
function pyMessage(err: unknown): string {
  const s = err instanceof Error ? err.message : String(err)
  const lines = s.trim().split('\n').filter(Boolean)
  return lines[lines.length - 1] ?? s
}

// Convert a Python result to a plain JS value so deepEqual can compare it to the
// JSON `expected`. Dicts become plain objects (not Maps); PyProxies are freed.
function toJsValue(raw: unknown): unknown {
  const v = raw as { toJs?: (o?: unknown) => unknown; destroy?: () => void }
  if (v && typeof v.toJs === 'function') {
    const js = v.toJs({ dict_converter: Object.fromEntries })
    v.destroy?.()
    return js
  }
  return raw
}

// Run the learner's Python once, then each test expression, in a fresh isolated
// namespace (no cross-exercise leakage). Each test's result is converted to JS and
// deep-compared to `expected`. Mirrors runTestCases for the JS engine.
export function runPythonTests(
  pyodide: PyodideLike,
  userCode: string,
  tests: ExerciseTest[],
): TestOutcome[] {
  const globals = pyodide.toPy({}) as { destroy?: () => void }
  try {
    try {
      pyodide.runPython(userCode, { globals })
    } catch (err) {
      const message = `Python error: ${pyMessage(err)}`
      return tests.map((t) => ({ name: t.name, passed: false, message }))
    }
    return tests.map((t) => {
      try {
        const actual = toJsValue(pyodide.runPython(t.expression, { globals }))
        if (deepEqual(actual, t.expected)) {
          return { name: t.name, passed: true, message: 'Passed' }
        }
        return {
          name: t.name,
          passed: false,
          message: `Expected ${show(t.expected)}, got ${show(actual)}`,
        }
      } catch (err) {
        return { name: t.name, passed: false, message: `Error: ${pyMessage(err)}` }
      }
    })
  } finally {
    globals.destroy?.()
  }
}
