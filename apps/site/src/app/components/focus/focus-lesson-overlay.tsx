import { GraduationCap, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { SectionLabel } from '@fw/ui'
import { getSessionTarget } from '@/lib/session-target'
import { SessionTimerInline } from '@/components/focus/session-timer-inline'
import { useAuth } from '@/hooks/auth-context'
import { LessonRoute } from '@/pages/app/learn'

// The real lesson, shown full-screen over a paused game during a focus session's
// learn phase (the game iframe stays mounted underneath, so state is preserved).
// Resolves the session's chosen topic → its next unfinished lesson, embeds the
// lesson player, and `onResume` (finish / "Back to game") returns to the game.
// Works for guests too — via the public course outline + guest lesson player.
export function FocusLessonOverlay({ onResume }: { onResume: () => void }) {
  const guest = !useAuth().user
  // undefined = resolving · null = nothing to show · string = the lesson id
  const [lessonId, setLessonId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const topic = getSessionTarget().topicSlug
    if (!topic) {
      setLessonId(null)
      return
    }
    let active = true
    ;(guest ? api.public.course(topic) : api.data.course(topic))
      .then((o) => active && setLessonId(o.nextLessonId ?? null))
      .catch(() => active && setLessonId(null))
    return () => {
      active = false
    }
  }, [guest])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4 flex justify-end">
          <SessionTimerInline />
        </div>
        {lessonId === undefined ? (
          <p className="mt-10 text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Loading your lesson…
          </p>
        ) : lessonId === null ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <GraduationCap className="size-8 text-primary" />
            <div>
              <SectionLabel>Interval reached</SectionLabel>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                No lesson queued up right now — pick a topic from the launcher to
                learn between rounds.
              </p>
            </div>
            <button
              type="button"
              onClick={onResume}
              className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
            >
              <Play className="size-4" /> Resume game
            </button>
          </div>
        ) : (
          <LessonRoute
            key={lessonId}
            lessonId={lessonId}
            guest={guest}
            onExit={onResume}
          />
        )}
      </div>
    </div>
  )
}
