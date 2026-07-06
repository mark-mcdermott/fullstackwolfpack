import { createContext, useContext } from 'react'
import type { FocusConfig, FocusResult, FocusStep } from '@/core/focus-session'

// The live focus timer, lifted out of the Sessions page so it keeps running
// across navigation and page reloads. `session` is present while a timer is
// active; `result` holds the last finished session's summary until dismissed.
export type TimerContextValue = {
  active: boolean
  paused: boolean
  step: FocusStep | null
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
  end: () => void
  dismiss: () => void
}

export const TimerContext = createContext<TimerContextValue | null>(null)

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within <TimerProvider>')
  return ctx
}
