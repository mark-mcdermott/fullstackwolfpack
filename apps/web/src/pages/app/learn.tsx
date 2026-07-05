import { ArrowLeft, ArrowRight, RotateCcw, Settings, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api-client'
import { CodeExercise } from '@/components/learn/code-exercise'
import { LessonMarkdown } from '@/components/learn/lesson-markdown'
import { QuizSegment } from '@/components/learn/quiz-segment'
import { TutorPanel } from '@/components/learn/tutor-panel'
import { AsyncView } from '@/components/layout/async-view'
import { Panel, Pill, ProgressMeter, SectionLabel } from '@fw/ui'
import { can } from '@/core/access'
import { lessonScore, xpForLesson } from '@/core/learning'
import type {
  AnswerFeedback,
  LessonCompletion,
  LessonView,
} from '@/core/lesson-view'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import { cn } from '@/lib/utils'

// The lesson player: steps through a lesson's segments one at a time (bite-sized, for
// studying between gaming sessions), grades quiz answers inline via the server, and
// shows the server's authoritative score + XP on completion.
export function LearnPage() {
  const { lessonId = '' } = useParams()
  const state = useAsync(() => api.data.lesson(lessonId))
  return (
    <AsyncView state={state}>{(lesson) => <LessonPlayer lesson={lesson} />}</AsyncView>
  )
}

function LessonPlayer({ lesson }: { lesson: LessonView }) {
  const { user } = useAuth()
  const canTutor = user ? can(user, 'feature.ai_tutor') : false
  const [index, setIndex] = useState(0)
  const [correctById, setCorrectById] = useState<Record<string, boolean>>({})
  const [quizXp, setQuizXp] = useState(0)
  const [completion, setCompletion] = useState<LessonCompletion | null>(null)
  const [completing, setCompleting] = useState(false)

  const totalQuestions = useMemo(
    () => lesson.segments.reduce((n, s) => n + s.questions.length, 0),
    [lesson],
  )

  function recordAnswer(fb: AnswerFeedback) {
    setCorrectById((prev) =>
      fb.questionId in prev ? prev : { ...prev, [fb.questionId]: fb.correct },
    )
    setQuizXp((xp) => xp + fb.xp)
  }

  async function finish() {
    if (completing) return
    setCompleting(true)
    try {
      setCompletion(await api.data.completeLesson(lesson.lessonId))
    } catch {
      // Fallback so the learner still sees a result if the write fails.
      const correct = Object.values(correctById).filter(Boolean).length
      const score = lessonScore(correct, totalQuestions)
      setCompletion({
        score,
        correct,
        total: totalQuestions,
        xp: quizXp + xpForLesson(score),
      })
    } finally {
      setCompleting(false)
    }
  }

  function restart() {
    setIndex(0)
    setCorrectById({})
    setQuizXp(0)
    setCompletion(null)
  }

  if (completion) {
    return (
      <CompletionPanel lesson={lesson} completion={completion} onRestart={restart} />
    )
  }

  const segment = lesson.segments[index]
  const isLast = index === lesson.segments.length - 1
  const stepPct = Math.round(((index + 1) / lesson.segments.length) * 100)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          to="/app/topics"
          className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Topics
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to={`/app/topics/${lesson.topicSlug}/settings`}
            aria-label="Topic settings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
          <Pill>{lesson.topic}</Pill>
        </div>
      </div>

      <div>
        <SectionLabel>Lesson</SectionLabel>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight uppercase">
          {lesson.title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <ProgressMeter value={stepPct} />
        <span className="font-mono text-[10px] whitespace-nowrap text-muted-foreground">
          {index + 1}/{lesson.segments.length}
        </span>
      </div>

      <Panel className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold uppercase">{segment.title}</h2>
          <Pill>
            {segment.type} · {segment.estMinutes} min
          </Pill>
        </div>
        <LessonMarkdown>{segment.markdown}</LessonMarkdown>
        {segment.exercise && <CodeExercise exercise={segment.exercise} />}
        {segment.questions.length > 0 && (
          <QuizSegment
            questions={segment.questions}
            onGrade={(questionId, input) => api.data.answer(questionId, input)}
            onAnswered={recordAnswer}
          />
        )}
      </Panel>

      <TutorPanel key={segment.id} segmentId={segment.id} canUse={canTutor} />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase disabled:opacity-30"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
          disabled={completing}
          className="inline-flex items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:opacity-50"
        >
          {isLast ? (completing ? 'Saving…' : 'Complete lesson') : 'Next'}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

function CompletionPanel({
  lesson,
  completion,
  onRestart,
}: {
  lesson: LessonView
  completion: LessonCompletion
  onRestart: () => void
}) {
  const mastered = completion.score >= 90
  // Fetch the course so we can advance the learner to the next lesson instead of
  // dead-ending at Topics. `nextLessonId` alone can't tell us "course finished" —
  // it falls back to the first lesson for review once everything's done — so we
  // derive the next lesson from the per-lesson status, skipping the one just
  // completed (which also keeps us correct if the completion write hit its fallback).
  const courseState = useAsync(() => api.data.course(lesson.topicSlug))
  const nextLessonId =
    courseState.data?.lessons.find(
      (l) => l.status !== 'completed' && l.lessonId !== lesson.lessonId,
    )?.lessonId ?? null
  const courseComplete = courseState.data != null && nextLessonId == null

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <Trophy
          className={cn('size-10', mastered ? 'text-primary' : 'text-muted-foreground')}
        />
        <SectionLabel>Lesson complete</SectionLabel>
        <h1 className="text-3xl font-semibold tracking-tight uppercase">{lesson.title}</h1>

        <div className="mt-2 grid grid-cols-3 gap-4 sm:gap-8">
          <Stat value={`${completion.score}%`} label="Score" />
          <Stat value={`${completion.correct}/${completion.total}`} label="Correct" />
          <Stat value={`+${completion.xp}`} label="XP earned" />
        </div>

        {courseComplete && (
          <div className="mt-4 flex items-center gap-2 border border-border px-4 py-3">
            <Trophy className="size-4 shrink-0 text-primary" />
            <p className="text-left text-xs text-muted-foreground">
              You've finished every lesson in{' '}
              <span className="font-bold text-foreground uppercase">{lesson.topic}</span>.
            </p>
          </div>
        )}

        <NextDifficulty />

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:border-muted-foreground"
          >
            <RotateCcw className="size-4" /> Review again
          </button>
          <Link
            to="/app/topics"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest uppercase',
              nextLessonId
                ? 'border border-border hover:border-muted-foreground'
                : 'bg-primary px-5 text-primary-foreground hover:bg-primary/80',
            )}
          >
            Back to topics
            {!nextLessonId && <ArrowRight className="size-4" />}
          </Link>
          {nextLessonId && (
            <Link
              to={`/app/learn/${nextLessonId}`}
              className="inline-flex items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
            >
              Continue course <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </Panel>
    </div>
  )
}

// Adaptive-difficulty nudge shown after finishing a lesson: recent accuracy drives
// a recommended difficulty for what to study next (core/adaptive.ts §5.4).
function NextDifficulty() {
  const state = useAsync(() => api.data.adaptive())
  const data = state.data
  // Only nudge when the recommendation actually moves the learner to a different
  // level — a clamped step (already at the floor/ceiling) is a no-op, not advice.
  if (!data || data.attempts < 4 || data.recommendedDifficulty === data.currentDifficulty) {
    return null
  }
  const Icon = data.direction === 'up' ? TrendingUp : TrendingDown
  return (
    <div className="mt-4 flex items-center gap-2 border border-border px-4 py-3">
      <Icon className="size-4 shrink-0 text-primary" />
      <p className="text-left text-xs text-muted-foreground">
        {data.reason} Try a{' '}
        <span className="font-bold text-foreground uppercase">
          {data.recommendedDifficulty}
        </span>{' '}
        course next.
      </p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}
