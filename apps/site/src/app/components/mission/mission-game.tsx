import { Maximize, Minimize } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TouchControls } from '@/components/controls/touch-controls'
import { bindsToRetroarchConfig, type RetroButton } from '@/core/controls'
import { coreForSystem } from '@/core/roms'
import { launchRom, type EmulatorSession } from '@/lib/emulator'
import {
  loadRomFile,
  type PlayableRom,
  RomNotFoundError,
} from '@/lib/rom-catalog'
import { loadGamepadBinds, loadKeyboardBinds } from '@/lib/controls-store'
import { useCoarsePointer } from '@/hooks/use-coarse-pointer'
import { useFullscreen } from '@/hooks/use-fullscreen'
import { cn } from '@/lib/utils'

type Status = 'loading' | 'playing' | 'missing' | 'error'

// Mounts the emulator canvas for a ROM — the lean core of RomPlayer without its
// full-page chrome — centered at the game's aspect. Keyboard-playable on desktop;
// on touch devices an on-screen gamepad (TouchControls) drives the same session.
export function MissionGame({
  rom,
  paused,
}: {
  rom: PlayableRom
  paused: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<EmulatorSession | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const coarse = useCoarsePointer()
  // The arcade route has had this all along; the mission surface never did,
  // because it was built as RomPlayer minus the page chrome. The target is the
  // whole column, not just the frame — the on-screen pad has to come with it or
  // fullscreen makes the game unplayable on a phone.
  const fs = useFullscreen<HTMLDivElement>()

  const pressDown = useCallback(
    (b: RetroButton) => sessionRef.current?.pressDown(b),
    [],
  )
  const pressUp = useCallback(
    (b: RetroButton) => sessionRef.current?.pressUp(b),
    [],
  )

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    const container = containerRef.current
    if (!container) return

    // Give Nostalgist its own canvas node (see rom-player for the why).
    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.imageRendering = 'pixelated'
    container.append(canvas)

    loadRomFile(rom)
      .then((file) => {
        if (cancelled) return
        return launchRom({
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
        setStatus(error instanceof RomNotFoundError ? 'missing' : 'error')
      })

    return () => {
      cancelled = true
      sessionRef.current?.stop()
      sessionRef.current = null
      canvas.remove()
    }
  }, [rom])

  // Pause the emulator while the lesson (learn phase) is up; resume after.
  // The core's pause/resume can throw inside the WASM runtime; swallow it so a
  // toggle hiccup never unmounts the mission view (it runs in an effect).
  useEffect(() => {
    const session = sessionRef.current
    if (!session || status !== 'playing') return
    try {
      if (paused) session.pause()
      else session.resume()
    } catch {
      // Core-level pause/resume failure — the lesson overlay hides the game anyway.
    }
  }, [paused, status])

  return (
    <div
      ref={fs.ref}
      className={cn(
        'flex w-full flex-col items-center gap-4',
        fs.isFullscreen && 'justify-center bg-black p-2',
        // The CSS fallback path (iPhone has no element-fullscreen API).
        // `dvh` so Safari's collapsing toolbars cannot crop the pad off the
        // bottom, which is the one thing that would make this worse than not
        // going fullscreen at all.
        fs.immersive && 'fixed inset-0 z-50 h-[100dvh] w-screen',
      )}
    >
      <div
        className={cn(
          'relative aspect-[10/9] overflow-hidden rounded-md border border-white/10 bg-black',
          fs.isFullscreen
            ? 'max-h-full min-h-0 w-auto max-w-full flex-1'
            : 'w-full max-w-[42rem]',
        )}
      >
        <div ref={containerRef} className="absolute inset-0" />
        <button
          type="button"
          onClick={fs.toggle}
          aria-label={fs.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="absolute top-2 right-2 z-10 flex size-9 items-center justify-center rounded-md border border-white/15 bg-black/55 text-white/80 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
        >
          {fs.isFullscreen ? (
            <Minimize className="size-4" />
          ) : (
            <Maximize className="size-4" />
          )}
        </button>
        {status !== 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[11px] tracking-wide text-white/50">
              {status === 'loading'
                ? `Loading ${rom.title}…`
                : status === 'missing'
                  ? `${rom.title} not found`
                  : 'Failed to start the game'}
            </span>
          </div>
        )}
      </div>
      {coarse && status === 'playing' && !paused && (
        <TouchControls system={rom.system} onDown={pressDown} onUp={pressUp} />
      )}
    </div>
  )
}
