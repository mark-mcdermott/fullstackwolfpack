// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { loadPyodide } from 'pyodide'
import { summarizeOutcomes } from '../core/exercise'
import { runPythonTests, type PyodideLike } from '../core/python-runner'
import { BUILTIN_COURSES } from './seed-content'

// Isolated from the fast suite: this file loads Pyodide (CPython→WASM) to run the
// Python exercise runner and validate every python built-in solution. Node
// environment so Pyodide uses its Node loader.

let pyodide: PyodideLike
beforeAll(async () => {
  pyodide = (await loadPyodide()) as unknown as PyodideLike
}, 60_000)

describe('runPythonTests', () => {
  it('passes a correct solution', () => {
    const out = runPythonTests(pyodide, 'def double(n):\n    return n * 2', [
      { name: 'double(4)', expression: 'double(4)', expected: 8 },
    ])
    expect(out[0].passed).toBe(true)
  })

  it('converts lists and dicts to JS for comparison', () => {
    const out = runPythonTests(
      pyodide,
      'def evens(n):\n    return [i for i in range(n) if i % 2 == 0]\ndef box(x):\n    return {"v": x}',
      [
        { name: 'evens', expression: 'evens(6)', expected: [0, 2, 4] },
        { name: 'box', expression: 'box(3)', expected: { v: 3 } },
      ],
    )
    expect(out.every((o) => o.passed)).toBe(true)
  })

  it('fails a wrong answer', () => {
    const out = runPythonTests(pyodide, 'def f():\n    return 1', [
      { name: 't', expression: 'f()', expected: 2 },
    ])
    expect(out[0].passed).toBe(false)
  })

  it('reports a Python syntax error as a failed test, not a throw', () => {
    const out = runPythonTests(pyodide, 'def bad(:\n    pass', [
      { name: 't', expression: 'bad()', expected: 1 },
    ])
    expect(out[0].passed).toBe(false)
    expect(out[0].message).toMatch(/python error/i)
  })
})

describe('python built-in exercises', () => {
  const pyExs = BUILTIN_COURSES.flatMap((c) =>
    c.lessons.flatMap((l) =>
      l.segments.flatMap((s) =>
        s.exercise && s.exercise.kind !== 'git' && s.exercise.language === 'python'
          ? [s.exercise]
          : [],
      ),
    ),
  )

  it('exist', () => {
    expect(pyExs.length).toBeGreaterThan(0)
  })

  it('every solution passes its own tests', () => {
    for (const ex of pyExs) {
      expect(
        summarizeOutcomes(runPythonTests(pyodide, ex.solution, ex.tests)).allPassed,
      ).toBe(true)
    }
  })
})
