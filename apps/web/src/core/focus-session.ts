// Focus-session runtime math — the "learn in short bursts between gaming
// sessions" loop. Pure and framework-agnostic: builds the play/learn plan,
// totals it, and scores how much of it the user actually completed. The UI
// (`components/focus/focus-session.tsx`) drives the clock; the server records
// the result into the `sessions` table. Unit-tested directly.

export type FocusPhase = 'play' | 'learn'
export type FocusConfig = {
  playMinutes: number
  learnMinutes: number
  rounds: number
}
export type FocusStep = { phase: FocusPhase; seconds: number }

export const PLAY_PRESETS = [15, 25, 45] as const
export const LEARN_PRESETS = [5, 10, 15] as const
export const ROUND_OPTIONS = [1, 2, 3, 4] as const

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  playMinutes: 25,
  learnMinutes: 5,
  rounds: 1,
}

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, Math.round(n)))

// Keep config within sane bounds so a hand-edited value can't build a
// nonsensical (or unbounded) plan.
export function normalizeFocusConfig(config: FocusConfig): FocusConfig {
  return {
    playMinutes: clamp(config.playMinutes, 1, 120),
    learnMinutes: clamp(config.learnMinutes, 1, 60),
    rounds: clamp(config.rounds, 1, 8),
  }
}

// A round is one play phase followed by one learn phase.
export function buildFocusPlan(config: FocusConfig): FocusStep[] {
  const { playMinutes, learnMinutes, rounds } = normalizeFocusConfig(config)
  const steps: FocusStep[] = []
  for (let r = 0; r < rounds; r++) {
    steps.push({ phase: 'play', seconds: playMinutes * 60 })
    steps.push({ phase: 'learn', seconds: learnMinutes * 60 })
  }
  return steps
}

export type FocusTotals = {
  playSeconds: number
  learnSeconds: number
  totalSeconds: number
}

export function planTotals(plan: FocusStep[]): FocusTotals {
  const playSeconds = plan
    .filter((s) => s.phase === 'play')
    .reduce((n, s) => n + s.seconds, 0)
  const learnSeconds = plan
    .filter((s) => s.phase === 'learn')
    .reduce((n, s) => n + s.seconds, 0)
  return { playSeconds, learnSeconds, totalSeconds: playSeconds + learnSeconds }
}

// Share of the planned time actually completed (0–100). Ending early lowers it.
export function focusScore(
  plannedSeconds: number,
  completedSeconds: number,
): number {
  if (plannedSeconds <= 0) return 0
  return clamp((completedSeconds / plannedSeconds) * 100, 0, 100)
}

export type FocusResult = {
  playMinutes: number
  learnMinutes: number
  playIntervalMin: number
  learnIntervalMin: number
  focusScore: number
}

// Turn the actual elapsed play/learn seconds into the recorded session shape.
export function focusResult(
  config: FocusConfig,
  completedPlaySeconds: number,
  completedLearnSeconds: number,
): FocusResult {
  const cfg = normalizeFocusConfig(config)
  const { totalSeconds } = planTotals(buildFocusPlan(cfg))
  const completed = Math.max(0, completedPlaySeconds + completedLearnSeconds)
  return {
    playMinutes: Math.round(Math.max(0, completedPlaySeconds) / 60),
    learnMinutes: Math.round(Math.max(0, completedLearnSeconds) / 60),
    playIntervalMin: cfg.playMinutes,
    learnIntervalMin: cfg.learnMinutes,
    focusScore: focusScore(totalSeconds, completed),
  }
}

// A session in progress, anchored to the wall clock so it survives navigation
// and page reloads without drift. Times are epoch milliseconds. `endsAt` is when
// the current phase hits zero while running; it's `null` while paused, and
// `pausedSecondsLeft` then holds the frozen remainder. `donePlay`/`doneLearn`
// bank the seconds from phases already finished (fully or partially skipped).
export type ActiveFocusSession = {
  config: FocusConfig
  plan: FocusStep[]
  stepIndex: number
  endsAt: number | null
  pausedSecondsLeft: number
  donePlay: number
  doneLearn: number
}

// What a play/learn session yielded once it stopped — fed to `focusResult`.
export type FocusTally = { playSeconds: number; learnSeconds: number }

// Either the session advanced and is still going, or it finished with a tally.
export type FocusStepResult =
  | { done: false; session: ActiveFocusSession }
  | { done: true; tally: FocusTally }

export function startFocusSession(
  config: FocusConfig,
  now: number,
): ActiveFocusSession {
  const plan = buildFocusPlan(config)
  return {
    config,
    plan,
    stepIndex: 0,
    endsAt: now + plan[0].seconds * 1000,
    pausedSecondsLeft: 0,
    donePlay: 0,
    doneLearn: 0,
  }
}

// Whole seconds left in the current phase (frozen value while paused).
export function secondsLeftIn(session: ActiveFocusSession, now: number): number {
  if (session.endsAt === null) return session.pausedSecondsLeft
  return Math.max(0, Math.ceil((session.endsAt - now) / 1000))
}

function bank(
  session: ActiveFocusSession,
  phase: FocusPhase,
  seconds: number,
): Pick<ActiveFocusSession, 'donePlay' | 'doneLearn'> {
  return {
    donePlay: session.donePlay + (phase === 'play' ? seconds : 0),
    doneLearn: session.doneLearn + (phase === 'learn' ? seconds : 0),
  }
}

// Roll a running session forward through every phase that has fully elapsed by
// `now` — one tick under normal use, but several at once after the tab was
// backgrounded or reloaded. Each elapsed phase banks its full planned seconds;
// running out of plan ends the session. A paused session never advances.
export function reconcileFocusSession(
  session: ActiveFocusSession,
  now: number,
): FocusStepResult {
  if (session.endsAt === null) return { done: false, session }
  let { stepIndex, endsAt, donePlay, doneLearn } = session
  while (endsAt <= now) {
    const step = session.plan[stepIndex]
    if (step.phase === 'play') donePlay += step.seconds
    else doneLearn += step.seconds
    stepIndex += 1
    if (stepIndex >= session.plan.length) {
      return { done: true, tally: { playSeconds: donePlay, learnSeconds: doneLearn } }
    }
    endsAt += session.plan[stepIndex].seconds * 1000
  }
  return {
    done: false,
    session: { ...session, stepIndex, endsAt, donePlay, doneLearn },
  }
}

export function pauseFocusSession(
  session: ActiveFocusSession,
  now: number,
): ActiveFocusSession {
  if (session.endsAt === null) return session
  return {
    ...session,
    endsAt: null,
    pausedSecondsLeft: secondsLeftIn(session, now),
  }
}

export function resumeFocusSession(
  session: ActiveFocusSession,
  now: number,
): ActiveFocusSession {
  if (session.endsAt !== null) return session
  return {
    ...session,
    endsAt: now + session.pausedSecondsLeft * 1000,
    pausedSecondsLeft: 0,
  }
}

// Skip the rest of the current phase — its elapsed time still counts — and move
// to the next (or finish). Preserves the paused/running state into the next phase.
export function skipFocusPhase(
  session: ActiveFocusSession,
  now: number,
): FocusStepResult {
  const step = session.plan[session.stepIndex]
  const elapsed = step.seconds - secondsLeftIn(session, now)
  const banked = bank(session, step.phase, elapsed)
  const next = session.stepIndex + 1
  if (next >= session.plan.length) {
    return {
      done: true,
      tally: { playSeconds: banked.donePlay, learnSeconds: banked.doneLearn },
    }
  }
  const paused = session.endsAt === null
  return {
    done: false,
    session: {
      ...session,
      ...banked,
      stepIndex: next,
      endsAt: paused ? null : now + session.plan[next].seconds * 1000,
      pausedSecondsLeft: paused ? session.plan[next].seconds : 0,
    },
  }
}

// End the session now, banking the current phase's elapsed time.
export function endFocusSession(
  session: ActiveFocusSession,
  now: number,
): FocusTally {
  const step = session.plan[session.stepIndex]
  const elapsed = step.seconds - secondsLeftIn(session, now)
  const banked = bank(session, step.phase, elapsed)
  return { playSeconds: banked.donePlay, learnSeconds: banked.doneLearn }
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

// XP for completing a focus session. The base is earned in proportion to how
// much of the plan you finished (focus score); learning time is rewarded per
// minute. Computed server-side from the (bounded) recorded result, never trusted
// from the client. Learning is weighted over play.
export const FOCUS_XP = { base: 20, perLearnMinute: 4 } as const

export function xpForFocusSession(result: {
  learnMinutes: number
  focusScore: number
}): number {
  const base = Math.round(FOCUS_XP.base * (result.focusScore / 100))
  return base + Math.max(0, result.learnMinutes) * FOCUS_XP.perLearnMinute
}
