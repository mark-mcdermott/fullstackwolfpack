import { useEffect, useRef, useState } from 'react'
import { bindsToRetroarchConfig } from '@/core/controls'
import { coreForSystem } from '@/core/roms'
import { launchRom, type EmulatorSession } from '@/lib/emulator'
import {
  loadRomFile,
  type PlayableRom,
  RomNotFoundError,
} from '@/lib/rom-catalog'
import { loadGamepadBinds, loadKeyboardBinds } from '@/lib/controls-store'

type Status = 'loading' | 'playing' | 'missing' | 'error'

// Mounts just the emulator canvas for a ROM — the lean core of RomPlayer without
// its full-page chrome — so the mission stage can host a live, keyboard-playable
// game. Keyboard binds come from the user's saved controls (arrows + Z/X etc.).
export function MissionGame({ rom }: { rom: PlayableRom }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<EmulatorSession | null>(null)
  const [status, setStatus] = useState<Status>('loading')

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

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={containerRef} className="absolute inset-0" />
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
  )
}
