import process from 'node:process'
import { loadPyodide } from 'pyodide'
import { summarizeOutcomes } from '../src/app/core/exercise'
import { runPythonTests, type PyodideLike } from '../src/app/core/python-runner'

// Validate ONE Python solution against its tests, in an isolated process so the
// parent (server/python-gate.ts) can enforce a hard timeout by killing it — an
// infinite-loop solution can't hang the build. Reads {solution, tests} JSON on
// stdin, prints PASS / FAIL.
let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (d) => {
  input += d
})
process.stdin.on('end', async () => {
  try {
    const { solution, tests } = JSON.parse(input)
    const pyodide = (await loadPyodide()) as unknown as PyodideLike
    const passed = summarizeOutcomes(
      runPythonTests(pyodide, solution, tests),
    ).allPassed
    process.stdout.write(passed ? 'PASS' : 'FAIL')
  } catch {
    process.stdout.write('FAIL')
  }
  process.exit(0)
})
