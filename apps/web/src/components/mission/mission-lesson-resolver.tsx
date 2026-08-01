import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { useAuth } from '@/hooks/auth-context'
import {
  loadLessonProgress,
  saveLessonProgress,
} from '@/lib/lesson-progress-store'
import { setMissionLessonToc } from '@/lib/mission-lesson-store'
import { getSessionTarget } from '@/lib/session-target'

type Outline = {
  lessonId: string
  title: string
  segments: { id: string; title: string; type: string }[]
}

// During the play phase the lesson player isn't mounted, so nothing feeds the
// Mission Control table of contents. This resolves the session's lesson outline
// (a cheap JSON fetch — no editor or code runtime) and publishes it with the
// persisted position, so the TOC shows in the play sidebar too. Clicking a
// section jumps into the lesson there (`onEnterSection`). It stays quiet during
// the learn phase, where the live lesson player publishes instead.
export function MissionLessonResolver({
  active,
  onEnterSection,
}: {
  active: boolean
  onEnterSection: () => void
}) {
  const guest = !useAuth().user
  const [outline, setOutline] = useState<Outline | null>(null)

  useEffect(() => {
    const topic = getSessionTarget().topicSlug
    if (!topic) return
    let alive = true
    ;(guest ? api.public.course(topic) : api.data.course(topic))
      .then((o) =>
        o.nextLessonId
          ? guest
            ? api.public.lesson(o.nextLessonId)
            : api.data.lesson(o.nextLessonId)
          : null,
      )
      .then((lesson) => {
        if (!alive || !lesson) return
        setOutline({
          lessonId: lesson.lessonId,
          title: lesson.title,
          segments: lesson.segments.map((s) => ({
            id: s.id,
            title: s.title,
            type: s.type,
          })),
        })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [guest])

  useEffect(() => {
    if (!active || !outline) return
    const prog = loadLessonProgress(outline.lessonId)
    const index = prog?.index ?? 0
    setMissionLessonToc({
      title: outline.title,
      segments: outline.segments,
      index,
      seen: prog?.seen ?? [index],
      onJump: (i) => {
        const prev = loadLessonProgress(outline.lessonId)
        saveLessonProgress(outline.lessonId, {
          index: i,
          correctById: prev?.correctById ?? {},
          quizXp: prev?.quizXp ?? 0,
          seen: [...new Set([...(prev?.seen ?? []), i])],
        })
        onEnterSection()
      },
    })
  }, [active, outline, onEnterSection])

  return null
}
