import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { z } from 'zod'
import { api } from '@/api-client'
import {
  endFocusSession,
  focusResult,
  pauseFocusSession,
  reconcileFocusSession,
  resumeFocusSession,
  secondsLeftIn,
  skipFocusPhase,
  startFocusSession,
  type ActiveFocusSession,
  type FocusConfig,
  type FocusResult,
  type FocusTally,
} from '@/core/focus-session'
import { clearSessionTarget } from '@/lib/session-target'
import { TimerContext, type TimerContextValue } from './timer-context'

// The running session is mirrored to localStorage so a reload (or a return to
// the tab) resumes it exactly where the wall clock says it should be.
const STORAGE_KEY = 'fw:focus:session'

const storedSessionSchema = z.object({
  config: z.object({
    playMinutes: z.number(),
    learnMinutes: z.number(),
    rounds: z.number(),
    startPhase: z.enum(['play', 'learn']).optional(),
  }),
  plan: z
    .array(z.object({ phase: z.enum(['play', 'learn']), seconds: z.number() }))
    .min(1),
  stepIndex: z.number().int().min(0),
  endsAt: z.number().nullable(),
  pausedSecondsLeft: z.number(),
  donePlay: z.number(),
  doneLearn: z.number(),
})

function loadStoredSession(): ActiveFocusSession | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = storedSessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success || parsed.data.stepIndex >= parsed.data.plan.length) {
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function saveStoredSession(session: ActiveFocusSession | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage full or blocked — the session just won't survive a reload.
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveFocusSession | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [result, setResult] = useState<FocusResult | null>(null)
  const [earnedXp, setEarnedXp] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Score the session, clear it, and record it server-side (best effort).
  const finalize = useCallback((config: FocusConfig, tally: FocusTally) => {
    setSession(null)
    saveStoredSession(null)
    clearSessionTarget()
    const res = focusResult(config, tally.playSeconds, tally.learnSeconds)
    setResult(res)
    setEarnedXp(null)
    setSaveError(null)
    void api.focus
      .record(res)
      .then(({ xp }) => setEarnedXp(xp))
      .catch(() => setSaveError('Session finished, but it could not be saved.'))
  }, [])

  // Resume a persisted session on mount, catching up on any elapsed time. We
  // take ownership of the stored copy immediately so React's double-mount can't
  // record the same finished session twice.
  useEffect(() => {
    const stored = loadStoredSession()
    if (!stored) return
    saveStoredSession(null)
    const reconciled = reconcileFocusSession(stored, Date.now())
    if (reconciled.done) finalize(stored.config, reconciled.tally)
    else setSession(reconciled.session)
  }, [finalize])

  // One clock for the lifetime of the provider. It reads the latest session
  // from a ref so it never needs re-arming, and only does work while running.
  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
    saveStoredSession(session)
  }, [session])

  useEffect(() => {
    const id = setInterval(() => {
      const cur = sessionRef.current
      if (!cur || cur.endsAt === null) return
      const t = Date.now()
      setNow(t)
      const stepped = reconcileFocusSession(cur, t)
      if (stepped.done) finalize(cur.config, stepped.tally)
      else if (stepped.session !== cur) setSession(stepped.session)
    }, 1000)
    return () => clearInterval(id)
  }, [finalize])

  const start = useCallback((config: FocusConfig) => {
    setResult(null)
    setEarnedXp(null)
    setSaveError(null)
    setNow(Date.now())
    setSession(startFocusSession(config, Date.now()))
  }, [])

  const pause = useCallback(() => {
    setSession((s) => (s ? pauseFocusSession(s, Date.now()) : s))
  }, [])

  const resume = useCallback(() => {
    setSession((s) => (s ? resumeFocusSession(s, Date.now()) : s))
  }, [])

  const skip = useCallback(() => {
    const cur = sessionRef.current
    if (!cur) return
    const stepped = skipFocusPhase(cur, Date.now())
    if (stepped.done) finalize(cur.config, stepped.tally)
    else setSession(stepped.session)
  }, [finalize])

  const end = useCallback(() => {
    const cur = sessionRef.current
    if (!cur) return
    finalize(cur.config, endFocusSession(cur, Date.now()))
  }, [finalize])

  const dismiss = useCallback(() => {
    setResult(null)
    setEarnedXp(null)
    setSaveError(null)
  }, [])

  const value = useMemo<TimerContextValue>(() => {
    const step = session ? session.plan[session.stepIndex] : null
    return {
      active: session !== null,
      paused: session !== null && session.endsAt === null,
      step,
      secondsLeft: session ? secondsLeftIn(session, now) : 0,
      currentRound: session ? Math.floor(session.stepIndex / 2) + 1 : 0,
      rounds: session ? session.plan.length / 2 : 0,
      result,
      earnedXp,
      saveError,
      start,
      pause,
      resume,
      skip,
      end,
      dismiss,
    }
  }, [session, now, result, earnedXp, saveError, start, pause, resume, skip, end, dismiss])

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}
