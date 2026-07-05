import {
  BookOpen,
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Square,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { Panel, ProgressMeter, SectionLabel } from '@fw/ui'
import {
  buildFocusPlan,
  DEFAULT_FOCUS_CONFIG,
  focusResult,
  formatClock,
  LEARN_PRESETS,
  PLAY_PRESETS,
  planTotals,
  ROUND_OPTIONS,
  type FocusConfig,
  type FocusResult,
  type FocusStep,
} from '@/core/focus-session'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'running' | 'done'

function Choice<T extends number>({
  value,
  options,
  suffix,
  onPick,
}: {
  value: T
  options: readonly T[]
  suffix: string
  onPick: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={cn(
            'min-w-12 border px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors',
            o === value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {o}
          {suffix}
        </button>
      ))}
    </div>
  )
}

export function FocusSession() {
  const [config, setConfig] = useState<FocusConfig>(DEFAULT_FOCUS_CONFIG)
  const [status, setStatus] = useState<Status>('idle')
  const [plan, setPlan] = useState<FocusStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  // Seconds from *fully completed* phases; the current phase's partial is added
  // at each transition/finish so the recorded totals stay exact.
  const [donePlay, setDonePlay] = useState(0)
  const [doneLearn, setDoneLearn] = useState(0)
  const [result, setResult] = useState<FocusResult | null>(null)
  const [earnedXp, setEarnedXp] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const step = plan[stepIndex]
  const totals = planTotals(buildFocusPlan(config))

  async function finalize(playSeconds: number, learnSeconds: number) {
    const res = focusResult(config, playSeconds, learnSeconds)
    setResult(res)
    setEarnedXp(null)
    setStatus('done')
    try {
      const { xp } = await api.focus.record(res)
      setEarnedXp(xp)
    } catch {
      setSaveError('Session finished, but it could not be saved.')
    }
  }

  function advance(nextDonePlay: number, nextDoneLearn: number) {
    const next = stepIndex + 1
    if (next >= plan.length) {
      void finalize(nextDonePlay, nextDoneLearn)
      return
    }
    setDonePlay(nextDonePlay)
    setDoneLearn(nextDoneLearn)
    setStepIndex(next)
    setSecondsLeft(plan[next].seconds)
  }

  // Tick down once a second while running.
  useEffect(() => {
    if (status !== 'running' || paused) return
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    )
    return () => clearInterval(id)
  }, [status, paused])

  // A phase that reaches 0 rolls into the next (or finishes the session).
  useEffect(() => {
    if (status !== 'running' || secondsLeft > 0 || !step) return
    advance(
      donePlay + (step.phase === 'play' ? step.seconds : 0),
      doneLearn + (step.phase === 'learn' ? step.seconds : 0),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, status])

  function start() {
    const p = buildFocusPlan(config)
    setPlan(p)
    setStepIndex(0)
    setSecondsLeft(p[0].seconds)
    setDonePlay(0)
    setDoneLearn(0)
    setResult(null)
    setEarnedXp(null)
    setSaveError(null)
    setPaused(false)
    setStatus('running')
  }

  // Skip the rest of the current phase (its elapsed time still counts).
  function skip() {
    const done = step.seconds - secondsLeft
    advance(
      donePlay + (step.phase === 'play' ? done : 0),
      doneLearn + (step.phase === 'learn' ? done : 0),
    )
  }

  // End now: bank the current phase's elapsed time and finalize.
  function end() {
    const done = step.seconds - secondsLeft
    void finalize(
      donePlay + (step.phase === 'play' ? done : 0),
      doneLearn + (step.phase === 'learn' ? done : 0),
    )
  }

  const rounds = Math.max(1, plan.length / 2)
  const currentRound = Math.floor(stepIndex / 2) + 1

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <SectionLabel>Focus session</SectionLabel>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Play · learn · repeat
        </span>
      </div>

      {status === 'idle' && (
        <div className="mt-5 flex flex-col gap-5">
          <p className="font-mono text-xs text-muted-foreground">
            Game in focused bursts, then a short learning sprint. We'll time the
            cycles and log the session.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Play
              </span>
              <Choice
                value={config.playMinutes}
                options={PLAY_PRESETS}
                suffix="m"
                onPick={(v) => setConfig((c) => ({ ...c, playMinutes: v }))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Learn
              </span>
              <Choice
                value={config.learnMinutes}
                options={LEARN_PRESETS}
                suffix="m"
                onPick={(v) => setConfig((c) => ({ ...c, learnMinutes: v }))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Rounds
              </span>
              <Choice
                value={config.rounds}
                options={ROUND_OPTIONS}
                suffix=""
                onPick={(v) => setConfig((c) => ({ ...c, rounds: v }))}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {config.rounds} round{config.rounds > 1 ? 's' : ''} ·{' '}
              {Math.round(totals.totalSeconds / 60)}m total
            </p>
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
            >
              <Play className="size-4" /> Start session
            </button>
          </div>
        </div>
      )}

      {status === 'running' && step && (
        <div className="mt-5 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
            {step.phase === 'play' ? (
              <Gamepad2 className="size-4 text-primary" />
            ) : (
              <BookOpen className="size-4 text-primary" />
            )}
            <span className="text-primary">
              {step.phase === 'play' ? 'Play' : 'Learn'}
            </span>
            <span className="text-muted-foreground">
              · round {currentRound} of {rounds}
            </span>
          </div>
          <p
            className="font-mono text-6xl font-bold tabular-nums"
            aria-label="time remaining"
          >
            {formatClock(secondsLeft)}
          </p>
          <div className="w-full max-w-sm">
            <ProgressMeter
              value={
                step.seconds > 0
                  ? Math.round(
                      ((step.seconds - secondsLeft) / step.seconds) * 100,
                    )
                  : 0
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              {paused ? (
                <>
                  <Play className="size-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="size-3.5" /> Pause
                </>
              )}
            </button>
            <button
              type="button"
              onClick={skip}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              <SkipForward className="size-3.5" /> Skip
            </button>
            <button
              type="button"
              onClick={end}
              className="inline-flex items-center gap-2 border border-destructive px-4 py-2 font-mono text-xs tracking-widest text-destructive uppercase hover:bg-destructive/10"
            >
              <Square className="size-3.5" /> End
            </button>
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <div className="mt-5 flex flex-col items-center gap-5 text-center">
          <p className="font-mono text-xs tracking-widest text-primary uppercase">
            Session complete
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {result.playMinutes}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Min played
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {result.learnMinutes}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Min learned
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {result.focusScore}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Focus score
              </p>
            </div>
          </div>
          {saveError ? (
            <p className="font-mono text-[10px] text-destructive">{saveError}</p>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {earnedXp !== null && (
                <p className="font-mono text-sm font-bold text-primary">
                  +{earnedXp} XP
                </p>
              )}
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Saved to your sessions
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            <RotateCcw className="size-4" /> New session
          </button>
        </div>
      )}
    </Panel>
  )
}
