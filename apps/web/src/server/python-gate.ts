import { execFile } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { ExerciseTest } from '../core/exercise'

// Node-side Python ship gate, mirroring solutionPassesTests for JS. Each solution
// runs in a short-lived child process (scripts/py-validate.ts) with a HARD timeout
// — a hung/infinite-loop solution is SIGKILLed and treated as a failure, so it
// can't hang gen:builtins or the tests. Used by gen:builtins (drop-invalid) and
// python-exercises.test.ts. Executes generated code, so keep it to trusted callers.
const VALIDATE = fileURLToPath(new URL('../../scripts/py-validate.ts', import.meta.url))

export function pythonSolutionPasses(
  solution: string,
  tests: ExerciseTest[],
  timeoutMs = 10_000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      ['--import', 'tsx', VALIDATE],
      { timeout: timeoutMs, killSignal: 'SIGKILL' },
      (err, stdout) => {
        if (err) return resolve(false) // timeout (killed) or crash → fails the gate
        resolve(stdout.trim().endsWith('PASS'))
      },
    )
    child.stdin?.end(JSON.stringify({ solution, tests }))
  })
}
