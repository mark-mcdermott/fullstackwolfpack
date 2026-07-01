import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { AnswerFeedback, QuestionView } from '@/core/lesson-view'
import { cn } from '@/lib/utils'

// Grades one question: the client renders it, calls `onGrade` (which stands in for
// POST /api/me/answer), and shows the feedback. The answer key only arrives back in
// the feedback — it's never in the QuestionView.
export type GradeFn = (
  questionId: string,
  selectedIndex: number,
) => Promise<AnswerFeedback>

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
      {questions.map((q) => (
        <QuizQuestion
          key={q.id}
          question={q}
          onGrade={onGrade}
          onAnswered={onAnswered}
        />
      ))}
    </div>
  )
}

function QuizQuestion({
  question,
  onGrade,
  onAnswered,
}: {
  question: QuestionView
  onGrade: GradeFn
  onAnswered?: (feedback: AnswerFeedback) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [pending, setPending] = useState(false)

  // Short-answer needs the AI grader (a later phase); MCQ is the fully-working path.
  if (question.type !== 'mcq' || !question.options) {
    return (
      <div className="border border-dashed border-border p-4 font-mono text-xs text-muted-foreground">
        {question.prompt}
        <p className="mt-2 tracking-widest uppercase">
          Short-answer grading (AI) — coming soon
        </p>
      </div>
    )
  }
  const options = question.options
  const answered = feedback !== null

  async function submit() {
    if (selected === null || pending || answered) return
    setPending(true)
    try {
      const fb = await onGrade(question.id, selected)
      setFeedback(fb)
      onAnswered?.(fb)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{question.prompt}</p>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isAnswer = answered && feedback.correctIndex === i
          const isWrongPick = answered && isSelected && !feedback.correct
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setSelected(i)}
              className={cn(
                'flex items-center gap-3 border px-4 py-3 text-left font-mono text-xs transition-colors',
                !answered && isSelected && 'border-primary',
                !answered &&
                  !isSelected &&
                  'border-border hover:border-muted-foreground',
                isAnswer && 'border-primary bg-primary/10',
                isWrongPick && 'border-red-500 bg-red-500/10',
                answered && !isAnswer && !isWrongPick && 'border-border opacity-50',
              )}
            >
              <span className="text-muted-foreground">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {isAnswer && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
              {isWrongPick && <XCircle className="size-4 shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {!answered && (
        <button
          type="button"
          onClick={submit}
          disabled={selected === null || pending}
          className="w-fit bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase disabled:opacity-40"
        >
          {pending ? 'Checking…' : 'Submit answer'}
        </button>
      )}

      {feedback && (
        <div className="flex flex-col gap-1 border-l-2 border-primary pl-4">
          <p className="font-mono text-xs tracking-widest uppercase">
            <span className={feedback.correct ? 'text-primary' : 'text-red-500'}>
              {feedback.correct ? 'Correct' : 'Not quite'}
            </span>
            <span className="text-muted-foreground"> · +{feedback.xp} XP</span>
          </p>
          {feedback.explanation && (
            <p className="text-xs text-muted-foreground">{feedback.explanation}</p>
          )}
        </div>
      )}
    </div>
  )
}
