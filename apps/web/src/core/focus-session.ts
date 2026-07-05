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

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}
