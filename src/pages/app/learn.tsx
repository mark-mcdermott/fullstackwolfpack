import { ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api-client'
import { LessonMarkdown } from '@/components/learn/lesson-markdown'
import { QuizSegment } from '@/components/learn/quiz-segment'
import { AsyncView } from '@/components/layout/async-view'
import { Panel, Pill, ProgressMeter, SectionLabel } from '@/components/ui-kit'
import { lessonScore, xpForLesson } from '@/core/learning'
import type {
  AnswerFeedback,
  LessonCompletion,
  LessonView,
} from '@/core/lesson-view'
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
        <Pill>{lesson.topic}</Pill>
      </div>

      <div>
        <SectionLabel>Lesson</SectionLabel>
        <h1 className="mt-2 text-3xl font-bold tracking-tight uppercase">
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
        {segment.questions.length > 0 && (
          <QuizSegment
            questions={segment.questions}
            onGrade={(questionId, selectedIndex) =>
              api.data.answer(questionId, selectedIndex)
            }
            onAnswered={recordAnswer}
          />
        )}
      </Panel>

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
  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <Trophy
          className={cn('size-10', mastered ? 'text-primary' : 'text-muted-foreground')}
        />
        <SectionLabel>Lesson complete</SectionLabel>
        <h1 className="text-3xl font-bold tracking-tight uppercase">{lesson.title}</h1>

        <div className="mt-2 grid grid-cols-3 gap-8">
          <Stat value={`${completion.score}%`} label="Score" />
          <Stat value={`${completion.correct}/${completion.total}`} label="Correct" />
          <Stat value={`+${completion.xp}`} label="XP earned" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:border-muted-foreground"
          >
            <RotateCcw className="size-4" /> Review again
          </button>
          <Link
            to="/app/topics"
            className="inline-flex items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            Back to topics <ArrowRight className="size-4" />
          </Link>
        </div>
      </Panel>
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
