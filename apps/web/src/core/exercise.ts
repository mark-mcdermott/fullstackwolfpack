import { transform } from 'sucrase'
import { z } from 'zod'

// The pure engine behind Phase 4 in-browser code exercises. It runs a learner's
// JavaScript against a set of assertion tests and reports pass/fail — with NO DOM
// and NO network, so it is unit-tested directly AND reused verbatim inside the Web
// Worker (src/workers/exercise-worker.ts). The worker only adds off-main-thread
// isolation + a timeout so an infinite loop can be terminated; the grading logic
// is all here. See docs/education-system.md §4.3.

// One test: evaluate `expression` (which may call functions the learner defined)
// against the learner's code and deep-compare the result to `expected`.
export const exerciseTestSchema = z.object({
  name: z.string(),
  expression: z.string(),
  expected: z.unknown(),
})
export type ExerciseTest = z.infer<typeof exerciseTestSchema>

export const exerciseTestsSchema = z.array(exerciseTestSchema)

export function parseExerciseTests(raw: unknown): ExerciseTest[] {
  const parsed = exerciseTestsSchema.safeParse(raw)
  return parsed.success ? parsed.data : []
}

export type TestOutcome = {
  name: string
  passed: boolean
  message: string
}

// Structural equality for the values tests compare (primitives, arrays, plain
// objects). NaN is treated as equal to NaN so numeric tests behave intuitively.
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a === 'number' && typeof b === 'number') {
    return Number.isNaN(a) && Number.isNaN(b)
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const ak = Object.keys(ao)
  const bk = Object.keys(bo)
  if (ak.length !== bk.length) return false
  return ak.every((k) => k in bo && deepEqual(ao[k], bo[k]))
}

function show(v: unknown): string {
  try {
    return typeof v === 'string' ? v : JSON.stringify(v)
  } catch {
    return String(v)
  }
}

// Run one test: build a function whose body is the learner's code followed by
// `return (expression)`, so the expression is evaluated in the learner's scope.
function runOne(userCode: string, test: ExerciseTest): TestOutcome {
  try {
    // eslint-disable-next-line no-new-func -- sandboxed: runs in a Web Worker in prod.
    const fn = new Function(`"use strict";\n${userCode}\n;return (${test.expression});`)
    const actual = fn()
    if (deepEqual(actual, test.expected)) {
      return { name: test.name, passed: true, message: 'Passed' }
    }
    return {
      name: test.name,
      passed: false,
      message: `Expected ${show(test.expected)}, got ${show(actual)}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { name: test.name, passed: false, message: `Error: ${message}` }
  }
}

// Exercises are authored in one of these; the runner is still JS underneath, so
// TypeScript is type-stripped to JS before evaluation.
export type ExerciseLanguage = 'js' | 'ts'

// Strip TypeScript syntax to runnable JS (types only — modern JS is left intact,
// which `new Function` runs fine). sucrase is small and worker-safe, unlike the
// full `typescript` compiler which would bloat the bundle.
function transpileTs(code: string): string {
  return transform(code, {
    transforms: ['typescript'],
    disableESTransforms: true,
  }).code
}

// Run every test against the learner's code. Deterministic and side-effect-free
// beyond evaluating the supplied code. TypeScript code is transpiled first; a
// transpile (syntax) error fails every test with a readable message.
export function runTestCases(
  userCode: string,
  tests: ExerciseTest[],
  language: ExerciseLanguage = 'js',
): TestOutcome[] {
  let code = userCode
  if (language === 'ts') {
    try {
      code = transpileTs(userCode)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return tests.map((t) => ({
        name: t.name,
        passed: false,
        message: `TypeScript error: ${message}`,
      }))
    }
  }
  return tests.map((t) => runOne(code, t))
}

export type ExerciseSummary = { passed: number; total: number; allPassed: boolean }

export function summarizeOutcomes(outcomes: TestOutcome[]): ExerciseSummary {
  const passed = outcomes.filter((o) => o.passed).length
  return { passed, total: outcomes.length, allPassed: outcomes.length > 0 && passed === outcomes.length }
}

// True when a solution passes every one of its tests. Used at build time
// (gen:builtins) to drop model-written exercises whose solution doesn't actually
// satisfy its tests — the same invariant the seed-content ship gate enforces.
// Executes the solution, so keep it to trusted/dev-time callers.
export function solutionPassesTests(
  solution: string,
  tests: ExerciseTest[],
  language: ExerciseLanguage = 'js',
): boolean {
  return summarizeOutcomes(runTestCases(solution, tests, language)).allPassed
}
