import { useSyncExternalStore } from 'react'

// A tiny in-memory bridge from the embedded lesson player (which owns its
// segment position) to the Mission Control panel next to it, so the panel can
// show a live table of contents — sections done / current / upcoming — without
// prop-drilling across the game↔lesson stage boundary. Mission-scoped: the
// lesson clears it on unmount.

export type MissionLessonToc = {
  title: string
  segments: { id: string; title: string; type: string }[]
  index: number
  // Indices the learner has visited (for done/upcoming styling under free jumps).
  seen: number[]
  // Jump the lesson player straight to a section (any direction).
  onJump: (index: number) => void
}

let snapshot: MissionLessonToc | null = null
const listeners = new Set<() => void>()

export function setMissionLessonToc(toc: MissionLessonToc | null): void {
  snapshot = toc
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): MissionLessonToc | null {
  return snapshot
}

export function useMissionLessonToc(): MissionLessonToc | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
