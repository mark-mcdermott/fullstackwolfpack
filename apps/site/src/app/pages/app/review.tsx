import { ArrowRight, CheckCircle2, Lock, Trophy, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '@/api-client'
import { siteUrl } from '@/consts'
import { AsyncView } from '@/components/layout/async-view'
import { Panel, Pill, ProgressMeter, SectionLabel } from '@fw/ui'
import { can } from '@/core/access'
import type { DueReview, ReviewQueue, ReviewResult } from '@/core/review-view'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import { cn } from '@/lib/utils'

// Spaced-repetition review session — a Pro feature (`smart_intervals`). Surfaces the
// cards that are due now (seeded when quiz questions are first answered) and reschedules
// each one via the pure SM-2 scheduler on the server. Kept as its own page (not on the
// dashboard) so it doesn't collide with the dashboard rebuild.
export function ReviewPage() {
  const { user } = useAuth()
  const state = useAsync(() => api.data.reviews())

  if (!user) return null
  if (!can(user, 'feature.smart_intervals')) return <ProUpsell />

  return (
    <AsyncView state={state}>{(queue) => <ReviewRunner queue={queue} />}</AsyncView>
  )
}

function ReviewRunner({ queue }: { queue: ReviewQueue }) {
  const [index, setIndex] = useState(0)
  const [reviewed, setReviewed] = useState(0)

  if (queue.reviews.length === 0 || index >= queue.reviews.length) {
    return <CaughtUp reviewed={reviewed} />
  }

  const current = queue.reviews[index]
  const total = queue.reviews.length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel>Review</SectionLabel>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight uppercase">
            Due today
          </h1>
        </div>
        <Pill>
          {index + 1}/{total}
        </Pill>
      </div>

      <ProgressMeter value={Math.round((index / total) * 100)} />

      <ReviewCard
        key={current.cardId}
        review={current}
        isLast={index === total - 1}
        onGraded={() => setReviewed((n) => n + 1)}
        onNext={() => setIndex((i) => i + 1)}
      />
    </div>
  )
}

function ReviewCard({
  review,
  isLast,
  onGraded,
  onNext,
}: {
  review: DueReview
  isLast: boolean
  onGraded: () => void
  onNext: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [pending, setPending] = useState(false)

  const options = review.options ?? []
  const answered = result !== null

  async function submit() {
    if (selected === null || pending || answered) return
    setPending(true)
    try {
      const r = await api.data.gradeReview(review.cardId, selected)
      setResult(r)
      onGraded()
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel className="flex flex-col gap-4">
      <p className="text-sm font-medium">{review.prompt}</p>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isAnswer = answered && result.correctIndex === i
          const isWrongPick = answered && isSelected && !result.correct
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

      {!answered ? (
        <button
          type="button"
          onClick={submit}
          disabled={selected === null || pending}
          className="w-fit bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase disabled:opacity-40"
        >
          {pending ? 'Checking…' : 'Submit'}
        </button>
      ) : (
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1 border-l-2 border-primary pl-4">
            <p className="font-mono text-xs tracking-widest uppercase">
              <span className={result.correct ? 'text-primary' : 'text-red-500'}>
                {result.correct ? 'Correct' : 'Not quite'}
              </span>
              <span className="text-muted-foreground">
                {' '}
                · next review {dueLabel(result.nextDueAt)}
              </span>
            </p>
            {result.explanation && (
              <p className="text-xs text-muted-foreground">{result.explanation}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex shrink-0 items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            {isLast ? 'Finish' : 'Next'} <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </Panel>
  )
}

function CaughtUp({ reviewed }: { reviewed: number }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <Trophy className="size-10 text-primary" />
        <SectionLabel>Review</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight uppercase">All caught up</h1>
        <p className="font-mono text-xs text-muted-foreground">
          {reviewed > 0
            ? `${reviewed} review${reviewed === 1 ? '' : 's'} done. Come back when more are due.`
            : 'Nothing due right now — answer some lessons to build your review queue.'}
        </p>
        <Link
          to="/app"
          className="mt-2 inline-flex items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
        >
          Back to dashboard <ArrowRight className="size-4" />
        </Link>
      </Panel>
    </div>
  )
}

function ProUpsell() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <SectionLabel>Pro feature</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight uppercase">
          Smart review intervals
        </h1>
        <p className="max-w-md font-mono text-xs text-muted-foreground">
          Spaced repetition brings each concept back right before you'd forget it.
          Upgrade to Pro to unlock your review queue.
        </p>
        <a
          href={siteUrl('/pricing')}
          className="mt-2 inline-flex items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
        >
          See Pro <ArrowRight className="size-4" />
        </a>
      </Panel>
    </div>
  )
}

// "next review tomorrow / in N days / later today"
function dueLabel(iso: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return 'later today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}
