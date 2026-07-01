import { ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { LessonMarkdown } from '@/components/learn/lesson-markdown'
import { QuizSegment } from '@/components/learn/quiz-segment'
import { AsyncView } from '@/components/layout/async-view'
import { Panel, Pill, ProgressMeter, SectionLabel } from '@/components/ui-kit'
import { lessonScore, xpForLesson } from '@/core/learning'
import type { AnswerFeedback, LessonView } from '@/core/lesson-view'
import { useAsync } from '@/hooks/use-async'
import { gradeSampleAnswer, loadSampleLesson } from '@/lib/sample-lesson'
import { cn } from '@/lib/utils'

// The lesson player: steps through a lesson's segments one at a time (bite-sized, for
// studying between gaming sessions), grades quiz questions inline, and tallies a score
// + XP on completion.
//
// It renders against a fixture (loadSampleLesson / gradeSampleAnswer) until the
// `lesson`/`answer` actions on api/me/[action].ts land — swapping to `api.data.lesson`
// / `api.data.gradeAnswer` is then a one-line change, since the shapes already match.
export function LearnPage() {
  const { lessonId = 'demo' } = useParams()
  const state = useAsync(() => loadSampleLesson(lessonId))
  return (
    <AsyncView state={state}>{(lesson) => <LessonPlayer lesson={lesson} />}</AsyncView>
  )
}

function LessonPlayer({ lesson }: { lesson: LessonView }) {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [correctById, setCorrectById] = useState<Record<string, boolean>>({})
  const [quizXp, setQuizXp] = useState(0)

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

  if (done) {
    const correct = Object.values(correctById).filter(Boolean).length
    const score = lessonScore(correct, totalQuestions)
    return (
      <CompletionPanel
        lesson={lesson}
        score={score}
        correct={correct}
        total={totalQuestions}
        xp={quizXp + xpForLesson(score)}
        onRestart={() => {
          setIndex(0)
          setDone(false)
          setCorrectById({})
          setQuizXp(0)
        }}
      />
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
            onGrade={gradeSampleAnswer}
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
          onClick={() => (isLast ? setDone(true) : setIndex((i) => i + 1))}
          className="inline-flex items-center gap-2 bg-primary px-5 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
        >
          {isLast ? 'Complete lesson' : 'Next'} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

function CompletionPanel({
  lesson,
  score,
  correct,
  total,
  xp,
  onRestart,
}: {
  lesson: LessonView
  score: number
  correct: number
  total: number
  xp: number
  onRestart: () => void
}) {
  const mastered = score >= 90
  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <Trophy
          className={cn('size-10', mastered ? 'text-primary' : 'text-muted-foreground')}
        />
        <SectionLabel>Lesson complete</SectionLabel>
        <h1 className="text-3xl font-bold tracking-tight uppercase">{lesson.title}</h1>

        <div className="mt-2 grid grid-cols-3 gap-8">
          <Stat value={`${score}%`} label="Score" />
          <Stat value={`${correct}/${total}`} label="Correct" />
          <Stat value={`+${xp}`} label="XP earned" />
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
