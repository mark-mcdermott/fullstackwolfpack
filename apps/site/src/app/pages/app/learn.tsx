import { ArrowLeft, ArrowRight, RotateCcw, Settings, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '@/api-client'
import { CodeExercise } from '@/components/learn/code-exercise'
import { TerminalExercise } from '@/components/learn/terminal-exercise'
import { LessonMarkdown } from '@/components/learn/lesson-markdown'
import { QuizSegment } from '@/components/learn/quiz-segment'
import { TutorPanel } from '@/components/learn/tutor-panel'
import { AsyncView } from '@/components/layout/async-view'
import {
  Panel,
  Pill,
  ProgressMeter,
  SectionLabel,
  raisedCtaClass,
  raisedCtaCompactClass,
  secondaryCtaClass,
} from '@fw/ui'
import { can } from '@/core/access'
import { lessonScore, xpForLesson } from '@/core/learning'
import { isScoredSegment, segmentLabel } from '@/core/lesson-view'
import { hasGlossaryEntry } from '@/content/glossary-entries'
import type {
  AnswerFeedback,
  LessonCompletion,
  LessonView,
} from '@/core/lesson-view'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import {
  completeLessonGuest,
  guestCompletedLessonIds,
} from '@/lib/guest-progress'
import { seedGuestReviewCard } from '@/lib/guest-review'
import {
  clearLessonProgress,
  loadLessonProgress,
  saveLessonProgress,
} from '@/lib/lesson-progress-store'
import { setMissionLessonToc } from '@/lib/mission-lesson-store'
import { cn } from '@/lib/utils'

// The lesson player: steps through a lesson's segments one at a time (bite-sized, for
// studying between gaming sessions), grades quiz answers inline via the server, and
// shows the server's authoritative score + XP on completion.
export function LearnPage({ guest = false }: { guest?: boolean }) {
  const { lessonId = '' } = useParams()
  // Key on the lesson id so moving between lessons ("Continue course" → the next
  // lesson) fully remounts the player: it refetches the lesson and resets
  // step/completion state. Without the key, React Router only re-renders the same
  // element — useAsync doesn't refetch and the stale completion panel stays up, so
  // the button appears to do nothing.
  return <LessonRoute key={lessonId} lessonId={lessonId} guest={guest} />
}

// Exported so the in-game focus overlay can embed the player (with `onExit` set
// to resume the game instead of navigating away).
export function LessonRoute({
  lessonId,
  guest = false,
  onExit,
  focusMode = false,
}: {
  lessonId: string
  guest?: boolean
  onExit?: () => void
  // Embedded inside the mission's center stage: drops the page chrome (its own
  // back-nav header + centering) and the guest tutor upsell so it reads as one
  // tile in the mission, not a standalone page.
  focusMode?: boolean
}) {
  const state = useAsync(() =>
    guest ? api.public.lesson(lessonId) : api.data.lesson(lessonId),
  )
  return (
    <AsyncView state={state}>
      {(lesson) => (
        <LessonPlayer
          lesson={lesson}
          guest={guest}
          onExit={onExit}
          focusMode={focusMode}
        />
      )}
    </AsyncView>
  )
}

function LessonPlayer({
  lesson,
  guest,
  onExit,
  focusMode = false,
}: {
  lesson: LessonView
  guest: boolean
  onExit?: () => void
  focusMode?: boolean
}) {
  const { user } = useAuth()
  const canTutor = user ? can(user, 'feature.ai_tutor') : false
  // Restore mid-lesson position (segment + answers) so leaving and coming back
  // resumes here instead of restarting. Keyed by lesson; cleared on completion.
  const [index, setIndex] = useState(
    () => loadLessonProgress(lesson.lessonId)?.index ?? 0,
  )
  const [correctById, setCorrectById] = useState<Record<string, boolean>>(
    () => loadLessonProgress(lesson.lessonId)?.correctById ?? {},
  )
  const [quizXp, setQuizXp] = useState(
    () => loadLessonProgress(lesson.lessonId)?.quizXp ?? 0,
  )
  // Sections visited — so the TOC can mark done vs upcoming correctly even when
  // the learner jumps around via the table of contents.
  const [seen, setSeen] = useState<Set<number>>(() => {
    const r = loadLessonProgress(lesson.lessonId)
    return new Set(r?.seen ?? [r?.index ?? 0])
  })
  const [completion, setCompletion] = useState<LessonCompletion | null>(null)
  const [completing, setCompleting] = useState(false)
  const [linkify, setLinkify] = useState(false)

  useEffect(() => {
    setSeen((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))
  }, [index])

  // Mirror position to localStorage as it changes (survives refresh / break).
  useEffect(() => {
    saveLessonProgress(lesson.lessonId, {
      index,
      correctById,
      quizXp,
      seen: [...seen],
    })
  }, [lesson.lessonId, index, correctById, quizXp, seen])

  // Feed the mission's Mission Control a live table of contents while embedded —
  // including a jump callback so its sections can navigate the lesson.
  useEffect(() => {
    if (!focusMode) return
    setMissionLessonToc({
      title: lesson.title,
      segments: lesson.segments.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
      })),
      index,
      seen: [...seen],
      onJump: setIndex,
    })
  }, [focusMode, lesson, index, seen])
  useEffect(() => () => setMissionLessonToc(null), [])

  // The preference governs *leaving*, not looking things up.
  //
  // It exists because a linked term used to mean a jump to Wikipedia mid-lesson,
  // which is reasonably opt-in. A term we have written an entry for no longer
  // does that — it opens in place and you stay in the paragraph — so those link
  // unconditionally, and the pref now only decides whether the ones we have not
  // written yet get their off-site fallback. Guests have no server prefs, so
  // they get the in-place terms and nothing external.
  useEffect(() => {
    if (guest) return
    let active = true
    api.preferences
      .get()
      .then((p) => active && setLinkify(p.linkifyTerms))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [guest])

  // Only graded questions count toward the score — see `isScoredSegment`. A
  // predict is meant to be missed, so counting it would mean a reader who
  // committed honestly to four guesses and learned from all four reveals still
  // finished the lesson "unmastered".
  const scoredQuestionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of lesson.segments) {
      if (!isScoredSegment(s.type)) continue
      for (const q of s.questions) ids.add(q.id)
    }
    return ids
  }, [lesson])
  const totalQuestions = scoredQuestionIds.size

  const correctCount = useCallback(
    () =>
      Object.entries(correctById).filter(
        ([id, ok]) => ok && scoredQuestionIds.has(id),
      ).length,
    [correctById, scoredQuestionIds],
  )

  function recordAnswer(fb: AnswerFeedback) {
    setCorrectById((prev) =>
      fb.questionId in prev ? prev : { ...prev, [fb.questionId]: fb.correct },
    )
    setQuizXp((xp) => xp + fb.xp)

    // Guests get a review queue too, seeded here rather than server-side: the
    // account path does this inside submitAnswer, but a guest's answer never
    // reaches a table. The prompt and options come from the lesson we already
    // hold, so the stored card can render itself later without a lookup a guest
    // has no route for.
    if (guest) {
      const q = lesson.segments
        .flatMap((s) => s.questions)
        .find((x) => x.id === fb.questionId)
      if (q) seedGuestReviewCard(q.id, q.prompt, q.options, fb.correct)
    }
  }

  async function finish() {
    if (completing) return
    setCompleting(true)
    try {
      const correct = correctCount()
      if (guest) {
        // Guests: compute + persist to localStorage (same core math as the server).
        setCompletion(
          completeLessonGuest(lesson.lessonId, correct, totalQuestions, quizXp),
        )
      } else {
        setCompletion(await api.data.completeLesson(lesson.lessonId))
      }
    } catch {
      // Fallback so the learner still sees a result if the write fails.
      const correct = correctCount()
      const score = lessonScore(correct, totalQuestions)
      setCompletion({
        score,
        correct,
        total: totalQuestions,
        xp: quizXp + xpForLesson(score),
      })
    } finally {
      setCompleting(false)
      // The lesson is done — drop its saved position so it doesn't resume mid-way.
      clearLessonProgress(lesson.lessonId)
    }
  }

  function restart() {
    setIndex(0)
    setCorrectById({})
    setQuizXp(0)
    setSeen(new Set([0]))
    setCompletion(null)
  }

  if (completion) {
    return (
      <CompletionPanel
        lesson={lesson}
        completion={completion}
        onRestart={restart}
        guest={guest}
        onExit={onExit}
      />
    )
  }

  const segment = lesson.segments[index]
  const isLast = index === lesson.segments.length - 1
  const stepPct = Math.round(((index + 1) / lesson.segments.length) * 100)

  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        !focusMode && 'mx-auto max-w-3xl',
      )}
    >
      {!focusMode && (
        <div className="flex items-center justify-between">
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> Resume game
            </button>
          ) : (
            <Link
              to={guest ? '/skill' : '/app/topics'}
              className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase hover:text-foreground"
            >
              <ArrowLeft className="size-3" /> Topics
            </Link>
          )}
          <div className="flex items-center gap-3">
            {!guest && !onExit && (
              <Link
                to={`/app/topics/${lesson.topicSlug}/settings`}
                aria-label="Topic settings"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="size-4" />
              </Link>
            )}
            <Pill>{lesson.topic}</Pill>
          </div>
        </div>
      )}

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
        {/* The badge is one atomic label — "SETUP · 2 MIN" only reads as a unit
            whole. So it never breaks internally; when the row runs out of room
            the *row* wraps and the whole pill drops under the title instead.
            That is what stops "MIN" stranding on its own line beneath a
            dangling separator, and it needs no way to detect a line break,
            which CSS has none. */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h2 className="text-lg font-bold uppercase">{segment.title}</h2>
          <Pill className="shrink-0 whitespace-nowrap">
            {segmentLabel(segment.type)} · {segment.estMinutes} min
          </Pill>
        </div>
        <LessonMarkdown
          terms={
            linkify
              ? lesson.glossary
              : lesson.glossary.filter(hasGlossaryEntry)
          }
        >
          {segment.markdown}
        </LessonMarkdown>
        {segment.exercise &&
          (segment.exercise.kind === 'git' ? (
            <TerminalExercise exercise={segment.exercise} />
          ) : (
            <CodeExercise exercise={segment.exercise} />
          ))}
        {segment.questions.length > 0 && (
          <QuizSegment
            questions={segment.questions}
            onGrade={(questionId, input) =>
              guest
                ? api.public.grade(questionId, input)
                : api.data.answer(questionId, input)
            }
            onAnswered={recordAnswer}
          />
        )}
      </Panel>

      <TutorPanel
        key={segment.id}
        segmentId={segment.id}
        canUse={canTutor}
        guest={guest}
        focusMode={focusMode}
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className={cn(secondaryCtaClass, 'disabled:opacity-30')}
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
          disabled={completing}
          className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-flare disabled:opacity-50')}
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
  guest,
  onExit,
}: {
  lesson: LessonView
  completion: LessonCompletion
  onRestart: () => void
  guest: boolean
  onExit?: () => void
}) {
  const mastered = completion.score >= 90
  // Fetch the course so we can advance the learner to the next lesson instead of
  // dead-ending at Topics. For guests the outline carries no progress, so "done"
  // comes from localStorage (the lesson just finished is already recorded there).
  const courseState = useAsync(() =>
    guest ? api.public.course(lesson.topicSlug) : api.data.course(lesson.topicSlug),
  )
  const done = guest ? guestCompletedLessonIds() : null
  const nextLessonId =
    courseState.data?.lessons.find(
      (l) =>
        (done ? !done.has(l.lessonId) : l.status !== 'completed') &&
        l.lessonId !== lesson.lessonId,
    )?.lessonId ?? null
  const courseComplete = courseState.data != null && nextLessonId == null
  const lessonHref = (id: string) => (guest ? `/learn/${id}` : `/app/learn/${id}`)

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

        {!guest && <NextDifficulty />}

        {guest && (
          <div className="mt-4 flex items-center gap-2 border border-primary/40 bg-primary/10 px-4 py-3">
            <Trophy className="size-4 shrink-0 text-primary" />
            <p className="text-left text-xs text-muted-foreground">
              You earned{' '}
              <span className="font-bold text-foreground">+{completion.xp} XP</span>{' '}
              as a guest.{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Create a free account
              </Link>{' '}
              to save it and keep your streak.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:border-muted-foreground"
          >
            <RotateCcw className="size-4" /> Review again
          </button>
          {onExit ? (
            // In-game overlay: complete → resume the game (don't navigate away).
            <button
              type="button"
              onClick={onExit}
              className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-flare')}
            >
              Back to game <ArrowRight className="size-4" />
            </button>
          ) : (
            <>
              <Link
                to={guest ? '/skill' : '/app/topics'}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest uppercase',
                  nextLessonId
                    ? 'border border-border hover:border-muted-foreground'
                    : cn(raisedCtaClass, raisedCtaCompactClass, 'cta-flare'),
                )}
              >
                Back to topics
                {!nextLessonId && <ArrowRight className="size-4" />}
              </Link>
              {nextLessonId && (
                <Link
                  to={lessonHref(nextLessonId)}
                  className={cn(raisedCtaClass, raisedCtaCompactClass, 'cta-flare')}
                >
                  Continue course <ArrowRight className="size-4" />
                </Link>
              )}
            </>
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
