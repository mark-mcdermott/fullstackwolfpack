import { useSyncExternalStore } from 'react'

// While a mission is on screen, the guest home registers its "take a break" /
// leave handler here so chrome outside the page — the header brand — can exit
// the mission the same way the bar's ✕ does. null when no mission is showing.

let handler: (() => void) | null = null
const listeners = new Set<() => void>()

export function setMissionExit(fn: (() => void) | null): void {
  handler = fn
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): (() => void) | null {
  return handler
}

export function useMissionExit(): (() => void) | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
