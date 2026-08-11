import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { AnswerFeedback, QuestionView } from '@/core/lesson-view'
import { normalizeQuestionPrompt } from '@/core/lesson-view'
import { cn } from '@/lib/utils'
import { raisedCtaClass, raisedCtaCompactClass } from '@fw/ui'
import { LessonMarkdown } from './lesson-markdown'

// Grades one question: the client renders it, calls `onGrade` (which stands in for
// POST /api/me/answer), and shows the feedback. The answer key only arrives back in
// the feedback — it's never in the QuestionView. MCQ sends a `selectedIndex`;
// short-answer sends `answerText` and gets an AI grade back (Phase 3).
export type GradeInput = { selectedIndex?: number; answerText?: string }
export type GradeFn = (questionId: string, input: GradeInput) => Promise<AnswerFeedback>

// A question prompt. Rendered as markdown rather than text because prompts are
// full of `code` spans and the occasional fence — as raw text those printed
// their own backticks.
function Prompt({ children }: { children: string }) {
  return (
    <LessonMarkdown className="gap-2 text-sm font-medium [&_p]:text-foreground">
      {normalizeQuestionPrompt(children)}
    </LessonMarkdown>
  )
}

export function QuizSegment({
  questions,
  onGrade,
  onAnswered,
}: {
  questions: QuestionView[]
  onGrade: GradeFn
  onAnswered?: (feedback: AnswerFeedback) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {questions.map((q) =>
        q.type === 'mcq' && q.options ? (
          <McqQuestion key={q.id} question={q} options={q.options} onGrade={onGrade} onAnswered={onAnswered} />
        ) : (
          <ShortAnswerQuestion key={q.id} question={q} onGrade={onGrade} onAnswered={onAnswered} />
        ),
      )}
    </div>
  )
}

function Feedback({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-l-2 pl-4',
        feedback.correct
          ? 'border-emerald-600/60 dark:border-emerald-400/50'
          : 'border-red-500/60',
      )}
    >
      <p className="font-mono text-xs tracking-widest uppercase">
        <span
          className={
            feedback.correct
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500'
          }
        >
          {feedback.correct ? 'Correct' : 'Not quite'}
        </span>
        {feedback.score !== null && (
          <span className="text-muted-foreground"> · {feedback.score}/5</span>
        )}
        <span className="text-muted-foreground"> · +{feedback.xp} XP</span>
      </p>
      {(feedback.feedback ?? feedback.explanation) && (
        // Markdown for the same reason as the prompt: explanations quote
        // identifiers in backticks, and as raw text those printed literally.
        <LessonMarkdown className="gap-2 text-xs">
          {feedback.feedback ?? feedback.explanation ?? ''}
        </LessonMarkdown>
      )}
    </div>
  )
}

function McqQuestion({
  question,
  options,
  onGrade,
  onAnswered,
}: {
  question: QuestionView
  options: string[]
  onGrade: GradeFn
  onAnswered?: (feedback: AnswerFeedback) => void
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [pending, setPending] = useState(false)
  const answered = feedback !== null

  // Choosing *is* answering — there is no separate confirm step.
  //
  // The two-step version asked the reader to commit twice for one decision, and
  // it cost the most where it mattered most: on a `predict`, the whole point is
  // a single honest commitment, and splitting it into "pick" then "are you
  // sure" invites the second-guessing the segment is designed to capture. The
  // usual argument for a confirm — an accidental tap being scored against you —
  // is thin here too, since predicts aren't scored at all.
  //
  // Takes the index as an argument rather than reading `chosen` back: state
  // updates aren't synchronous, so grading off the parameter avoids submitting
  // a stale (or null) selection.
  async function choose(i: number) {
    if (answered || pending) return
    setChosen(i)
    setPending(true)
    try {
      const fb = await onGrade(question.id, { selectedIndex: i })
      setFeedback(fb)
      onAnswered?.(fb)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Prompt>{question.prompt}</Prompt>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const isChosen = chosen === i
          const isAnswer = answered && feedback.correctIndex === i
          const isWrongPick = answered && isChosen && !feedback.correct
          const isChecking = pending && isChosen
          return (
            <button
              key={i}
              type="button"
              disabled={answered || pending}
              aria-busy={isChecking}
              onClick={() => void choose(i)}
              className={cn(
                'flex items-center gap-3 border px-4 py-3 text-left font-mono text-xs transition-colors',
                !answered && !isChosen && 'border-border hover:border-muted-foreground',
                isChecking && 'border-primary',
                // Green for right, red for wrong. `primary` is the brand red, so
                // marking the correct answer with it made both outcomes read as
                // the same colour — which matters more now that the colour *is*
                // the result, with no submit step in between.
                isAnswer &&
                  'border-emerald-600/60 bg-emerald-500/10 dark:border-emerald-400/50',
                isWrongPick && 'border-red-500 bg-red-500/10',
                answered && !isAnswer && !isWrongPick && 'border-border opacity-50',
                // Only the untouched options dim while one is in flight, so the
                // choice you just made stays legible during the round trip.
                pending && !isChosen && 'opacity-50',
              )}
            >
              <span className="text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{opt}</span>
              {isChecking && (
                <span className="shrink-0 text-[10px] tracking-widest text-muted-foreground uppercase">
                  Checking…
                </span>
              )}
              {isAnswer && (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              {isWrongPick && <XCircle className="size-4 shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {feedback && <Feedback feedback={feedback} />}
    </div>
  )
}

// Free-text answer, graded by the AI grader server-side (Phase 3). Kept answerable
// once — the feedback + score are revealed after submitting.
function ShortAnswerQuestion({
  question,
  onGrade,
  onAnswered,
}: {
  question: QuestionView
  onGrade: GradeFn
  onAnswered?: (feedback: AnswerFeedback) => void
}) {
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [pending, setPending] = useState(false)
  const answered = feedback !== null

  async function submit() {
    if (text.trim() === '' || pending || answered) return
    setPending(true)
    try {
      const fb = await onGrade(question.id, { answerText: text.trim() })
      setFeedback(fb)
      onAnswered?.(fb)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Prompt>{question.prompt}</Prompt>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={answered}
        rows={3}
        placeholder="Type your answer…"
        className="border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-muted-foreground disabled:opacity-60"
      />
      {!answered && (
        <button
          type="button"
          onClick={submit}
          disabled={text.trim() === '' || pending}
          className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-blaze disabled:opacity-40')}
        >
          {pending ? 'Grading…' : 'Submit answer'}
        </button>
      )}
      {feedback && <Feedback feedback={feedback} />}
    </div>
  )
}
