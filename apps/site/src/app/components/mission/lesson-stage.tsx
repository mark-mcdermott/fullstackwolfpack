import { GraduationCap, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { Panel, SectionLabel } from '@fw/ui'
import { getSessionTarget } from '@/lib/session-target'
import { useAuth } from '@/hooks/auth-context'
import { LessonRoute } from '@/pages/app/learn'

// The learn phase of a mission, rendered in place of the game in the center
// stage (the game stays mounted + paused behind it). Resolves the session's
// chosen topic → its next unfinished lesson and embeds the real lesson player
// in `focusMode` (no page chrome, no tutor upsell). `onResume` skips back to
// play. Works for guests via the public course outline + guest lesson player.
export function LessonStage({ onResume }: { onResume: () => void }) {
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

  if (lessonId === undefined) {
    return (
      <Panel brackets={false} className="rounded-2xl p-5">
        <p className="py-10 text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Loading your lesson…
        </p>
      </Panel>
    )
  }

  if (lessonId === null) {
    return (
      <Panel brackets={false} className="rounded-2xl p-5">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
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
      </Panel>
    )
  }

  return (
    <Panel brackets={false} className="rounded-2xl p-5 sm:p-6">
      <LessonRoute key={lessonId} lessonId={lessonId} guest={guest} onExit={onResume} focusMode />
    </Panel>
  )
}
