import {
  BookOpen,
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Square,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Panel, ProgressMeter, SectionLabel } from '@fw/ui'
import {
  buildFocusPlan,
  DEFAULT_FOCUS_CONFIG,
  formatClock,
  LEARN_PRESETS,
  PLAY_PRESETS,
  planTotals,
  ROUND_OPTIONS,
  type FocusConfig,
} from '@/core/focus-session'
import { useTimer } from '@/hooks/timer-context'
import { cn } from '@/lib/utils'

// The clamps `normalizeFocusConfig` enforces — mirrored here for the inputs.
const PLAY_RANGE = { min: 1, max: 120 }
const LEARN_RANGE = { min: 1, max: 60 }

function PresetButton<T extends number>({
  option,
  active,
  suffix,
  onPick,
}: {
  option: T
  active: boolean
  suffix: string
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'min-w-12 border px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {option}
      {suffix}
    </button>
  )
}

// Quick presets plus a free numeric field, clamped to the config's real bounds.
function DurationField({
  label,
  value,
  presets,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  presets: readonly number[]
  min: number
  max: number
  onChange: (v: number) => void
}) {
  function onCustom(raw: string) {
    if (raw === '') return
    const n = Math.round(Number(raw))
    if (!Number.isFinite(n)) return
    onChange(Math.max(min, Math.min(max, n)))
  }
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((o) => (
          <PresetButton
            key={o}
            option={o}
            active={o === value}
            suffix="m"
            onPick={() => onChange(o)}
          />
        ))}
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onCustom(e.target.value)}
          aria-label={`${label} minutes (custom)`}
          className="w-16 border border-border bg-transparent px-2 py-1.5 text-center font-mono text-xs tabular-nums outline-none focus:border-primary"
        />
      </div>
    </label>
  )
}

export function FocusSession() {
  const timer = useTimer()
  const navigate = useNavigate()
  const [config, setConfig] = useState<FocusConfig>(DEFAULT_FOCUS_CONFIG)
  const totals = planTotals(buildFocusPlan(config))

  const idle = !timer.active && !timer.result

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <SectionLabel>Focus session</SectionLabel>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Play · learn · repeat
        </span>
      </div>

      {idle && (
        <div className="mt-5 flex flex-col gap-5">
          <p className="font-mono text-xs text-muted-foreground">
            Game in focused bursts, then a short learning sprint. We'll time the
            cycles and log the session — the timer keeps running as you move
            around the app.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <DurationField
              label="Play"
              value={config.playMinutes}
              presets={PLAY_PRESETS}
              min={PLAY_RANGE.min}
              max={PLAY_RANGE.max}
              onChange={(v) => setConfig((c) => ({ ...c, playMinutes: v }))}
            />
            <DurationField
              label="Learn"
              value={config.learnMinutes}
              presets={LEARN_PRESETS}
              min={LEARN_RANGE.min}
              max={LEARN_RANGE.max}
              onChange={(v) => setConfig((c) => ({ ...c, learnMinutes: v }))}
            />
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Rounds
              </span>
              <div className="flex flex-wrap gap-2">
                {ROUND_OPTIONS.map((o) => (
                  <PresetButton
                    key={o}
                    option={o}
                    active={o === config.rounds}
                    suffix=""
                    onPick={() => setConfig((c) => ({ ...c, rounds: o }))}
                  />
                ))}
              </div>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {config.rounds} round{config.rounds > 1 ? 's' : ''} ·{' '}
              {Math.round(totals.totalSeconds / 60)}m total
            </p>
            <button
              type="button"
              onClick={() => timer.start(config)}
              className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
            >
              <Play className="size-4" /> Start session
            </button>
          </div>
        </div>
      )}

      {timer.active && timer.step && (
        <div className="mt-5 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
            {timer.step.phase === 'play' ? (
              <Gamepad2 className="size-4 text-primary" />
            ) : (
              <BookOpen className="size-4 text-primary" />
            )}
            <span className="text-primary">
              {timer.step.phase === 'play' ? 'Play' : 'Learn'}
            </span>
            <span className="text-muted-foreground">
              · round {timer.currentRound} of {timer.rounds}
            </span>
          </div>
          <p
            className="font-mono text-6xl font-bold tabular-nums"
            aria-label="time remaining"
          >
            {formatClock(timer.secondsLeft)}
          </p>
          <div className="w-full max-w-sm">
            <ProgressMeter
              value={
                timer.step.seconds > 0
                  ? Math.round(
                      ((timer.step.seconds - timer.secondsLeft) /
                        timer.step.seconds) *
                        100,
                    )
                  : 0
              }
            />
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(timer.step?.phase === 'play' ? '/app/arcade' : '/app/topics')
            }
            className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            {timer.step.phase === 'play' ? (
              <>
                <Gamepad2 className="size-4" /> Play now
              </>
            ) : (
              <>
                <BookOpen className="size-4" /> Learn now
              </>
            )}
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => (timer.paused ? timer.resume() : timer.pause())}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              {timer.paused ? (
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
              onClick={timer.skip}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              <SkipForward className="size-3.5" /> Skip
            </button>
            <button
              type="button"
              onClick={timer.end}
              className="inline-flex items-center gap-2 border border-destructive px-4 py-2 font-mono text-xs tracking-widest text-destructive uppercase hover:bg-destructive/10"
            >
              <Square className="size-3.5" /> End
            </button>
          </div>
        </div>
      )}

      {!timer.active && timer.result && (
        <div className="mt-5 flex flex-col items-center gap-5 text-center">
          <p className="font-mono text-xs tracking-widest text-primary uppercase">
            Session complete
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {timer.result.playMinutes}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Min played
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {timer.result.learnMinutes}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Min learned
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {timer.result.focusScore}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Focus score
              </p>
            </div>
          </div>
          {timer.saveError ? (
            <p className="font-mono text-[10px] text-destructive">
              {timer.saveError}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {timer.earnedXp !== null && (
                <p className="font-mono text-sm font-bold text-primary">
                  +{timer.earnedXp} XP
                </p>
              )}
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Saved to your sessions
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={timer.dismiss}
            className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            <RotateCcw className="size-4" /> New session
          </button>
        </div>
      )}
    </Panel>
  )
}
