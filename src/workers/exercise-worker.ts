import { runTestCases, type ExerciseTest } from '@/core/exercise'

// Runs the learner's code + tests OFF the main thread so an infinite loop can be
// terminated by the caller (src/lib/run-exercise.ts). The grading logic itself is
// the pure, unit-tested core/exercise.ts — this file is only the message plumbing.

type Incoming = { userCode: string; tests: ExerciseTest[] }

// Typed narrowly to avoid pulling the DOM `Window` shape onto `self`.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<Incoming>) => void) | null
  postMessage: (msg: unknown) => void
}

ctx.onmessage = (e) => {
  ctx.postMessage(runTestCases(e.data.userCode, e.data.tests))
}
