import { Gamepad2, GraduationCap, LogOut, Pause, Play, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ControlsReference } from '@/components/controls/controls-reference'
import { Panel, Pill, SectionLabel } from '@fw/ui'
import { bindsToRetroarchConfig } from '@/core/controls'
import { coreForSystem, SYSTEM_META } from '@/core/roms'
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
  const [lessonOpen, setLessonOpen] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setPaused(false)
    setLessonOpen(false)
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

  function pauseForLesson() {
    sessionRef.current?.pause()
    setPaused(true)
    setLessonOpen(true)
  }

  function resumeFromLesson() {
    sessionRef.current?.resume()
    setPaused(false)
    setLessonOpen(false)
  }

  const meta = SYSTEM_META[rom.system]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Now playing</SectionLabel>
          <h1 className="mt-1 text-3xl font-semibold uppercase">{rom.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Pill>{meta.label}</Pill>
          <ControlButton icon={LogOut} label="Exit" onClick={onExit} />
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="relative aspect-video w-full bg-black">
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

          {lessonOpen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center">
              <GraduationCap className="size-8 text-primary" />
              <div>
                <SectionLabel>Interval reached</SectionLabel>
                <h2 className="mt-1 text-2xl font-bold uppercase">
                  Time to learn
                </h2>
                <p className="mx-auto mt-2 max-w-sm font-mono text-xs text-muted-foreground">
                  The game is paused. This is where your next lesson drops in —
                  finish it to keep your streak, then jump back in.
                </p>
              </div>
              <ControlButton
                icon={Play}
                label="Resume game"
                onClick={resumeFromLesson}
                variant="primary"
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
        <ControlButton
          icon={GraduationCap}
          label="Pause for lesson"
          onClick={pauseForLesson}
          variant="primary"
        />
        <ControlButton
          icon={Gamepad2}
          label="Controls"
          onClick={() => setControlsOpen((open) => !open)}
        />
      </div>
    </div>
  )
}
