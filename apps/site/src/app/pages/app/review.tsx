import { ArrowRight, CheckCircle2, Lock, Trophy, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '@/api-client'
import { siteUrl } from '@/consts'
import { AsyncView } from '@/components/layout/async-view'
import { LessonMarkdown } from '@/components/learn/lesson-markdown'
import {
  Panel,
  Pill,
  ProgressMeter,
  SectionLabel,
  raisedCtaClass,
  raisedCtaCompactClass,
} from '@fw/ui'
import { can } from '@/core/access'
import { normalizeQuestionPrompt } from '@/core/lesson-view'
import type { DueReview, ReviewQueue, ReviewResult } from '@/core/review-view'
import { localReviewResult } from '@/core/review-view'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import {
  guestNextDueAt,
  guestReviewQueue,
  rescheduleGuestReview,
} from '@/lib/guest-review'
import { cn } from '@/lib/utils'

// Grading one card, which is the only thing the guest and account paths do
// differently. An account posts to /api/me/review and the server reschedules; a
// guest checks the answer against the same public route the lesson player uses
// and reschedules locally with the same pure scheduler. Everything below this
// line is shared.
type GradeReviewFn = (
  cardId: string,
  selectedIndex: number,
) => Promise<ReviewResult>

const gradeViaAccount: GradeReviewFn = (cardId, selectedIndex) =>
  api.data.gradeReview(cardId, selectedIndex)

// `cardId` is the question id for a guest — see lib/guest-review.
const gradeAsGuest: GradeReviewFn = async (cardId, selectedIndex) => {
  const fb = await api.public.grade(cardId, { selectedIndex })
  const { rating, nextDueAt } = rescheduleGuestReview(cardId, fb.correct)
  return {
    cardId,
    correct: fb.correct,
    correctIndex: fb.correctIndex,
    explanation: fb.explanation,
    rating,
    nextDueAt,
  }
}

// Spaced-repetition review session — a Pro feature (`smart_intervals`). Surfaces the
// cards that are due now (seeded when quiz questions are first answered) and reschedules
// each one via the pure SM-2 scheduler on the server. Kept as its own page (not on the
// dashboard) so it doesn't collide with the dashboard rebuild.
export function ReviewPage({ guest = false }: { guest?: boolean }) {
  const { user } = useAuth()
  // Both sides await: a guest schedules locally but looks its questions up over
  // the public route, so neither queue is a synchronous read.
  const state = useAsync(() => (guest ? guestReviewQueue() : api.data.reviews()))

  if (!guest) {
    if (!user) return null
    if (!can(user, 'feature.smart_intervals')) return <ProUpsell />
  }

  return (
    <AsyncView state={state}>
      {(queue) => (
        <ReviewRunner
          queue={queue}
          grade={guest ? gradeAsGuest : gradeViaAccount}
          guest={guest}
        />
      )}
    </AsyncView>
  )
}

function ReviewRunner({
  queue,
  grade,
  guest,
}: {
  queue: ReviewQueue
  grade: GradeReviewFn
  guest: boolean
}) {
  const [index, setIndex] = useState(0)
  const [reviewed, setReviewed] = useState(0)

  if (queue.reviews.length === 0 || index >= queue.reviews.length) {
    return <CaughtUp reviewed={reviewed} guest={guest} />
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
        grade={grade}
        isLast={index === total - 1}
        onGraded={() => setReviewed((n) => n + 1)}
        onNext={() => setIndex((i) => i + 1)}
      />
    </div>
  )
}

// Deliberately the same interaction as the lesson quiz (quiz-segment.tsx):
// choosing an answer grades it, green means right and red means wrong. This
// screen had drifted into its own version — a confirm step, and `primary` (the
// brand red) marking the *correct* answer, so both outcomes read as red. Two
// quiz behaviours in one product is the same confusion as two names for one
// idea; if the interaction changes there, change it here too.
function ReviewCard({
  review,
  grade,
  isLast,
  onGraded,
  onNext,
}: {
  review: DueReview
  grade: GradeReviewFn
  isLast: boolean
  onGraded: () => void
  onNext: () => void
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [pending, setPending] = useState(false)

  const options = review.options ?? []
  const answered = result !== null

  async function choose(i: number) {
    if (answered || pending) return
    setChosen(i)

    // A due card ships its key and its schedule, so the verdict *and* the next due
    // date are both computable here — see core/review-view.ts. `grade` still runs
    // behind it: on the account path it is what reschedules the row, and on the guest
    // path what writes the new schedule to localStorage.
    const local = localReviewResult(review, i)
    if (local) {
      setResult(local)
      onGraded()
      void grade(review.cardId, i)
        // Both sides ran the same pure scheduler over the same card, so this only
        // corrects a card that moved underneath the reader.
        .then(setResult)
        // Swallowed: a dropped reschedule must not retract a verdict already shown.
        // The card stays due and simply comes back round.
        .catch(() => {})
      return
    }

    setPending(true)
    try {
      const r = await grade(review.cardId, i)
      setResult(r)
      onGraded()
    } finally {
      setPending(false)
    }
  }

  return (
    <Panel className="flex flex-col gap-4">
      {/* The code the prompt was written against, which the lesson had above it
          and this page has nothing else to supply. Muted and above the prompt,
          the order it was read in — it is what the question is about, not part
          of the asking. */}
      {review.context && (
        <LessonMarkdown className="gap-2 text-sm text-muted-foreground">
          {review.context}
        </LessonMarkdown>
      )}
      <LessonMarkdown className="gap-2 text-sm font-medium [&_p]:text-foreground">
        {normalizeQuestionPrompt(review.prompt)}
      </LessonMarkdown>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const isChosen = chosen === i
          const isAnswer = answered && result.correctIndex === i
          const isWrongPick = answered && isChosen && !result.correct
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
                !answered &&
                  !isChosen &&
                  'border-border hover:border-muted-foreground',
                // Neutral while in flight — see quiz-segment.tsx.
                isChecking && 'border-muted-foreground',
                isAnswer &&
                  'border-emerald-600/60 bg-emerald-500/10 dark:border-emerald-400/50',
                isWrongPick && 'border-red-500 bg-red-500/10',
                answered && !isAnswer && !isWrongPick && 'border-border opacity-50',
                pending && !isChosen && 'opacity-50',
              )}
            >
              <span className="text-muted-foreground">
                {String.fromCharCode(65 + i)}
              </span>
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

      {answered && (
        <div className="flex items-end justify-between gap-4">
          <div
            className={cn(
              'flex flex-col gap-1 border-l-2 pl-4',
              result.correct
                ? 'border-emerald-600/60 dark:border-emerald-400/50'
                : 'border-red-500/60',
            )}
          >
            <p className="font-mono text-xs tracking-widest uppercase">
              <span
                className={
                  result.correct
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-500'
                }
              >
                {result.correct ? 'Correct' : 'Not quite'}
              </span>
              <span className="text-muted-foreground">
                {' '}
                · next review {dueLabel(result.nextDueAt)}
              </span>
            </p>
            {result.explanation && (
              <LessonMarkdown className="gap-2 text-xs">
                {result.explanation}
              </LessonMarkdown>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            className={cn(
              raisedCtaClass,
              raisedCtaCompactClass,
              'cta-blaze shrink-0',
            )}
          >
            {isLast ? 'Finish' : 'Next'} <ArrowRight className="size-4" />
          </button>
        </div>
      )}
    </Panel>
  )
}

// The empty state has to distinguish "you have nothing" from "you have cards,
// none are due yet" — because the second is the *normal* state on the day you
// learn something. The scheduler's shortest interval is a whole day, so a
// learner who answers questions and comes straight here would otherwise be told
// "nothing due — answer some lessons", having just done exactly that, and
// conclude the feature is broken.
function CaughtUp({ reviewed, guest }: { reviewed: number; guest: boolean }) {
  // Only guests can be asked this locally; an account's schedule lives server-
  // side and the queue endpoint returns only what is already due.
  const nextDue = guest ? guestNextDueAt() : null
  const waiting = nextDue !== null && new Date(nextDue) > new Date()

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <Trophy className="size-10 text-primary" />
        <SectionLabel>Review</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight uppercase">
          All caught up
        </h1>
        <p className="max-w-md font-mono text-xs text-muted-foreground">
          {reviewed > 0
            ? `${reviewed} review${reviewed === 1 ? '' : 's'} done. Come back when more are due.`
            : waiting
              ? `Nothing due yet — your next review lands ${dueLabel(nextDue)}. Spacing them out is the point: coming back just as it starts to fade is what makes it stick.`
              : 'Nothing due right now — answer some lesson questions to build your review queue.'}
        </p>
        <Link
          to={guest ? '/javascript' : '/app'}
          className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-blaze mt-2')}
        >
          {guest ? 'Back to lessons' : 'Back to dashboard'}{' '}
          <ArrowRight className="size-4" />
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
          className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-blaze mt-2')}
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
