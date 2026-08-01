import { createContext, useContext } from 'react'
import type { FocusConfig, FocusResult, FocusStep } from '@/core/focus-session'

// The live focus timer, lifted out of the Sessions page so it keeps running
// across navigation and page reloads. `session` is present while a timer is
// active; `result` holds the last finished session's summary until dismissed.
export type TimerContextValue = {
  active: boolean
  paused: boolean
  step: FocusStep | null
  // The full play/learn plan and the index of the phase currently running —
  // drives the clickable session-progress timeline.
  plan: FocusStep[]
  stepIndex: number
  secondsLeft: number
  currentRound: number
  rounds: number
  result: FocusResult | null
  earnedXp: number | null
  saveError: string | null
  start: (config: FocusConfig) => void
  pause: () => void
  resume: () => void
  skip: () => void
  // Jump straight to a phase by plan index (the progress timeline's nodes).
  jump: (index: number) => void
  end: () => void
  dismiss: () => void
}

export const TimerContext = createContext<TimerContextValue | null>(null)

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within <TimerProvider>')
  return ctx
}
