import {
  Gamepad2,
  GraduationCap,
  LogOut,
  Maximize,
  Minimize,
  Pause,
  Play,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ControlsReference } from '@/components/controls/controls-reference'
import { TouchControls } from '@/components/controls/touch-controls'
import { FocusLessonOverlay } from '@/components/focus/focus-lesson-overlay'
import { SessionTimerInline } from '@/components/focus/session-timer-inline'
import { Panel, Pill, SectionLabel } from '@fw/ui'
import { useTimer } from '@/hooks/timer-context'
import { bindsToRetroarchConfig, type RetroButton } from '@/core/controls'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { coreForSystem, SYSTEM_META } from '@/core/roms'
import { usePlaytimeTracker } from '@/hooks/use-playtime-tracker'
import { loadGamepadBinds, loadKeyboardBinds } from '@/lib/controls-store'
import {
  type EmulatorSession,
  type Launcher,
  launchRom,
} from '@/lib/emulator'
import {
  loadRomFile,
  type PlayableRom,
  RomNotFoundError,
} from '@/lib/rom-catalog'
import { cn } from '@/lib/utils'

type Status = 'loading' | 'playing' | 'missing' | 'error'

function ControlButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: typeof Pause
  label: string
  onClick: () => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-xs tracking-widest uppercase',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/80'
          : 'border border-border hover:bg-muted',
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function RomPlayer({
  rom,
  onExit,
  launcher = launchRom,
}: {
  rom: PlayableRom
  onExit: () => void
  launcher?: Launcher
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<EmulatorSession | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [paused, setPaused] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const coarsePointer = useCoarsePointer()
  const fs = useFullscreen<HTMLDivElement>()
  const timer = useTimer()
  usePlaytimeTracker(rom)

  // During a focus session's learn phase, pause the emulator and overlay the real
  // lesson; returning to play resumes it.
  const learnPhase = timer.active && timer.step?.phase === 'learn'
  useEffect(() => {
    const session = sessionRef.current
    if (!session) return
    if (learnPhase) {
      session.pause()
      setPaused(true)
    } else if (timer.active) {
      session.resume()
      setPaused(false)
    }
  }, [learnPhase, timer.active])

  const pressButton = useCallback((button: RetroButton) => {
    sessionRef.current?.pressDown(button)
  }, [])
  const releaseButton = useCallback((button: RetroButton) => {
    sessionRef.current?.pressUp(button)
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setPaused(false)
    setControlsOpen(false)

    const container = containerRef.current
    if (!container) return

    // React owns the container; Nostalgist owns this canvas. Keeping them on
    // separate nodes stops Nostalgist's exit handler (which calls
    // canvas.remove()) from fighting React's reconciliation — and stops it
    // from re-appending a now-detached canvas to <body> on StrictMode's
    // double-mount, which pushed the game below the footer.
    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.imageRendering = 'pixelated'
    container.append(canvas)

    loadRomFile(rom)
      .then((file) => {
        if (cancelled) return
        return launcher({
          core: coreForSystem(rom.system),
          rom: file,
          canvas,
          retroarchConfig: bindsToRetroarchConfig(
            loadKeyboardBinds(),
            loadGamepadBinds(),
          ),
        }).then((session) => {
          if (cancelled) {
            session.stop()
            return
          }
          sessionRef.current = session
          setStatus('playing')
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof RomNotFoundError) {
          setStatus('missing')
        } else {
          console.error('[arcade] failed to start emulator', error)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
      sessionRef.current?.stop()
      sessionRef.current = null
      canvas.remove()
    }
  }, [rom, launcher])

  function togglePause() {
    const session = sessionRef.current
    if (!session) return
    if (paused) {
      session.resume()
      setPaused(false)
    } else {
      session.pause()
      setPaused(true)
    }
  }

  // Finish/exit the in-game lesson → advance the timer back to play (the pause
  // effect above resumes the emulator).
  const resumeFromLesson = () => timer.skip()

  const meta = SYSTEM_META[rom.system]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Now playing</SectionLabel>
          <h1 className="mt-1 text-3xl font-semibold uppercase">{rom.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SessionTimerInline />
          <div className="flex items-center gap-3">
            <Pill>{meta.label}</Pill>
            <ControlButton icon={LogOut} label="Exit" onClick={onExit} />
          </div>
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div
          ref={fs.ref}
          className={cn(
            'relative w-full bg-black',
            fs.isFullscreen ? 'h-full' : 'aspect-video',
            // The CSS fallback (iPhone, where there is no fullscreen API):
            // pin the surface to the viewport itself. `dvh` rather than `vh`
            // so Safari's collapsing toolbars do not crop the bottom.
            fs.immersive && 'fixed inset-0 z-50 h-[100dvh] w-screen',
          )}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="font-mono text-xs tracking-widest text-primary uppercase">
                Loading {rom.title}…
              </p>
            </div>
          )}

          {(status === 'missing' || status === 'error') && (
            <div
              role="alert"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center"
            >
              <p className="font-mono text-xs tracking-widest text-destructive uppercase">
                {status === 'missing'
                  ? 'Game not installed'
                  : 'Couldn’t start this game'}
              </p>
              <p className="max-w-md font-mono text-xs text-muted-foreground">
                {status === 'missing' && rom.source === 'catalog'
                  ? `Drop ${rom.fileName} into public/roms/ to play it (see the README there).`
                  : 'The emulator couldn’t start. Check your connection and try again.'}
              </p>
              <ControlButton
                icon={LogOut}
                label="Back to gallery"
                onClick={onExit}
              />
            </div>
          )}

          {controlsOpen && (
            <div className="absolute inset-0 flex flex-col gap-4 overflow-auto bg-background/97 p-5">
              <div className="flex items-center justify-between">
                <SectionLabel>Controls</SectionLabel>
                <button
                  type="button"
                  onClick={() => setControlsOpen(false)}
                  aria-label="Close controls"
                  className="border border-border p-1.5 hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ControlsReference />
              <Link
                to="/app/settings"
                className="w-fit font-mono text-[10px] tracking-widest text-primary uppercase hover:underline"
              >
                Change these in Settings → Arcade controls
              </Link>
            </div>
          )}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <ControlButton
          icon={paused ? Play : Pause}
          label={paused ? 'Resume' : 'Pause'}
          onClick={togglePause}
        />
        {timer.active && timer.step?.phase === 'play' && (
          <ControlButton
            icon={GraduationCap}
            label="Learn now"
            onClick={timer.skip}
            variant="primary"
          />
        )}
        <ControlButton
          icon={Gamepad2}
          label="Controls"
          onClick={() => setControlsOpen((open) => !open)}
        />
        {fs.supported && (
          <ControlButton
            icon={fs.isFullscreen ? Minimize : Maximize}
            label={fs.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={fs.toggle}
          />
        )}
      </div>

      {coarsePointer && status === 'playing' && !learnPhase && (
        <TouchControls
          system={rom.system}
          onDown={pressButton}
          onUp={releaseButton}
        />
      )}

      {learnPhase && <FocusLessonOverlay onResume={resumeFromLesson} />}
    </div>
  )
}
