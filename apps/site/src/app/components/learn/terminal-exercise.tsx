import { CheckCircle2, Circle, Lightbulb, RotateCcw } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  applyCommand,
  checkGoals,
  initialState,
  runSession,
  type GitState,
  type TranscriptEntry,
} from '@/core/git-sim'
import type { GitExerciseView } from '@/core/lesson-view'
import { cn } from '@/lib/utils'
import { LessonMarkdown } from './lesson-markdown'

const withSetup = (setup: string[]): GitState =>
  runSession(initialState(), setup).state

// Terminal/git exercise (terminal-lane Phase 1): the learner types shell commands
// that run against the pure core/git-sim.ts simulator; success is a live checklist
// of goals asserted against the resulting repo state. No Web Worker needed — the
// sim executes discrete commands, not arbitrary looping code.
export function TerminalExercise({
  exercise,
  onSolved,
}: {
  exercise: GitExerciseView
  onSolved?: () => void
}) {
  const [state, setState] = useState<GitState>(() => withSetup(exercise.setup))
  const [history, setHistory] = useState<TranscriptEntry[]>([])
  const [input, setInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [solved, setSolved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const goals = useMemo(
    () => checkGoals(state, exercise.goals),
    [state, exercise.goals],
  )
  const allMet = goals.length > 0 && goals.every((g) => g.met)

  function markSolved(next: GitState) {
    const done = checkGoals(next, exercise.goals)
    if (done.length > 0 && done.every((g) => g.met) && !solved) {
      setSolved(true)
      onSolved?.()
    }
  }

  function submit() {
    const line = input.trim()
    if (!line) return
    const res = applyCommand(state, line)
    setState(res.state)
    setHistory((h) => [...h, { command: line, output: res.output, error: res.error }])
    setInput('')
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
    )
    markSolved(res.state)
  }

  function reset() {
    setState(withSetup(exercise.setup))
    setHistory([])
    setInput('')
    setSolved(false)
  }

  function showSolution() {
    const { state: final, transcript } = runSession(
      withSetup(exercise.setup),
      exercise.solution,
    )
    setState(final)
    setHistory(transcript)
    setInput('')
  }

  return (
    <div className="flex flex-col gap-3">
      <LessonMarkdown>{exercise.prompt}</LessonMarkdown>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="max-h-72 overflow-y-auto border border-border bg-[#0d1117] p-3 font-mono text-xs leading-relaxed text-emerald-200"
      >
        {history.map((h, i) => (
          <div key={i}>
            <div>
              <span className="text-emerald-500">$</span> {h.command}
            </div>
            {h.output && (
              <pre
                className={cn(
                  'whitespace-pre-wrap',
                  h.error ? 'text-red-400' : 'text-emerald-200/70',
                )}
              >
                {h.output}
              </pre>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-emerald-500">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Terminal command input"
            placeholder="type a command and press Enter"
            className="flex-1 bg-transparent text-emerald-100 outline-none placeholder:text-emerald-200/30"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className={secondaryCtaClass}
        >
          <RotateCcw className="size-3.5" /> Reset
        </button>
        {exercise.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className={secondaryCtaClass}
          >
            <Lightbulb className="size-3.5" /> {showHint ? 'Hide hint' : 'Hint'}
          </button>
        )}
        <button
          type="button"
          onClick={showSolution}
          className={secondaryCtaClass}
        >
          Show solution
        </button>
      </div>

      {showHint && exercise.hint && (
        <p className="border-l-2 border-primary pl-4 text-xs text-muted-foreground">
          {exercise.hint}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <p
          className={cn(
            'font-mono text-[10px] tracking-widest uppercase',
            allMet ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {goals.filter((g) => g.met).length}/{goals.length} goals met
        </p>
        <ul className="flex flex-col gap-1">
          {goals.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {g.met ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className={g.met ? 'text-foreground' : 'text-muted-foreground'}>
                {g.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
