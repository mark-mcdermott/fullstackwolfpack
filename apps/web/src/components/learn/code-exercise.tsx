import { CheckCircle2, Lightbulb, Play, RotateCcw, XCircle } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { summarizeOutcomes, type TestOutcome } from '@/core/exercise'
import type { ExerciseView } from '@/core/lesson-view'
import { runExercise } from '@/lib/run-exercise'
import { cn } from '@/lib/utils'
import { LessonMarkdown } from './lesson-markdown'

// Phase 4 in-browser code exercise: edit starter code, run hidden tests in a Web
// Worker, and see pass/fail. Hint and solution are revealed only on request.
export function CodeExercise({
  exercise,
  onSolved,
}: {
  exercise: ExerciseView
  onSolved?: () => void
}) {
  const [code, setCode] = useState(exercise.starterCode)
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const summary = outcomes ? summarizeOutcomes(outcomes) : null

  async function run() {
    if (running) return
    setRunning(true)
    setError(null)
    const res = await runExercise(code, exercise.tests)
    if (res.ok) {
      setOutcomes(res.outcomes)
      if (summarizeOutcomes(res.outcomes).allPassed) onSolved?.()
    } else {
      setError(res.error)
      setOutcomes(null)
    }
    setRunning(false)
  }

  function reset() {
    setCode(exercise.starterCode)
    setOutcomes(null)
    setError(null)
    setShowSolution(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <LessonMarkdown>{exercise.prompt}</LessonMarkdown>

      <CodeEditorLazy value={code} onChange={setCode} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:opacity-50"
        >
          <Play className="size-3.5" /> {running ? 'Running…' : 'Run tests'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] tracking-widest uppercase hover:border-muted-foreground"
        >
          <RotateCcw className="size-3.5" /> Reset
        </button>
        {exercise.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] tracking-widest uppercase hover:border-muted-foreground"
          >
            <Lightbulb className="size-3.5" /> {showHint ? 'Hide hint' : 'Hint'}
          </button>
        )}
        {exercise.solution && (
          <button
            type="button"
            onClick={() => {
              setShowSolution(true)
              setCode(exercise.solution ?? code)
            }}
            className="border border-border px-3 py-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase hover:border-muted-foreground"
          >
            Show solution
          </button>
        )}
      </div>

      {showHint && exercise.hint && (
        <p className="border-l-2 border-primary pl-4 text-xs text-muted-foreground">
          {exercise.hint}
        </p>
      )}

      {error && <p className="font-mono text-xs text-red-500">{error}</p>}

      {summary && (
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              'font-mono text-[10px] tracking-widest uppercase',
              summary.allPassed ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {summary.passed}/{summary.total} tests passing
            {summary.allPassed && showSolution && ' (solution shown)'}
          </p>
          <ul className="flex flex-col gap-1">
            {outcomes?.map((o) => (
              <li key={o.name} className="flex items-start gap-2 font-mono text-xs">
                {o.passed ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                )}
                <span className={o.passed ? 'text-foreground' : 'text-muted-foreground'}>
                  {o.name}
                  {!o.passed && <span className="text-red-500"> — {o.message}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// The editor imports CodeMirror (a heavier chunk); keep it lazy so the player's
// first paint isn't blocked by exercises the learner may not reach.
const CodeEditor = lazy(() =>
  import('./code-editor').then((m) => ({ default: m.CodeEditor })),
)

function CodeEditorLazy(props: { value: string; onChange: (v: string) => void }) {
  return (
    <Suspense
      fallback={
        <pre className="overflow-x-auto border border-border bg-card p-4 font-mono text-sm">
          {props.value}
        </pre>
      }
    >
      <CodeEditor {...props} />
    </Suspense>
  )
}
