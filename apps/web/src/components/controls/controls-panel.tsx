import { Gamepad2, Keyboard, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Panel, SectionLabel } from '@fw/ui'
import {
  BUTTON_META,
  DEFAULT_GAMEPAD_BINDS,
  DEFAULT_KEYBOARD_BINDS,
  formatRetroKey,
  type GamepadBinds,
  type KeyboardBinds,
  type RetroButton,
  RETROPAD_BUTTONS,
  retroKeyFromCode,
} from '@/core/controls'
import {
  loadGamepadBinds,
  loadKeyboardBinds,
  resetGamepadBinds,
  resetKeyboardBinds,
  saveGamepadBinds,
  saveKeyboardBinds,
} from '@/lib/controls-store'
import { cn } from '@/lib/utils'
import { GamepadDiagram } from './gamepad-diagram'
import { KeyboardDiagram } from './keyboard-diagram'

type Device = 'keyboard' | 'gamepad'

export function ControlsPanel() {
  const [keyboard, setKeyboard] = useState<KeyboardBinds>(loadKeyboardBinds)
  const [gamepad, setGamepad] = useState<GamepadBinds>(loadGamepadBinds)
  const [device, setDevice] = useState<Device>('keyboard')
  const [listening, setListening] = useState<RetroButton | null>(null)
  const [padName, setPadName] = useState<string | null>(null)

  function bindKeyboard(button: RetroButton, key: string) {
    setKeyboard((prev) => {
      const next = { ...prev, [button]: key }
      saveKeyboardBinds(next)
      return next
    })
  }

  function bindGamepad(button: RetroButton, index: number) {
    setGamepad((prev) => {
      const next = { ...prev, [button]: index }
      saveGamepadBinds(next)
      return next
    })
  }

  // Capture the next key press for the button being rebound (keyboard device).
  useEffect(() => {
    if (!listening) return
    const button = listening
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        setListening(null)
        return
      }
      if (device !== 'keyboard') return
      e.preventDefault()
      const key = retroKeyFromCode(e.code)
      if (!key) return // unsupported key — keep listening
      bindKeyboard(button, key)
      setListening(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listening, device])

  // Capture the next pressed pad button (gamepad device).
  useEffect(() => {
    if (!listening || device !== 'gamepad') return
    const button = listening
    let raf = 0
    function poll() {
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (!pad) continue
        const index = pad.buttons.findIndex((b) => b.pressed)
        if (index >= 0) {
          bindGamepad(button, index)
          setListening(null)
          return
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [listening, device])

  // Surface which controller (if any) the browser sees.
  useEffect(() => {
    function scan() {
      const pad = (navigator.getGamepads?.() ?? []).find(Boolean)
      setPadName(pad?.id ?? null)
    }
    scan()
    window.addEventListener('gamepadconnected', scan)
    window.addEventListener('gamepaddisconnected', scan)
    const timer = setInterval(scan, 1500)
    return () => {
      window.removeEventListener('gamepadconnected', scan)
      window.removeEventListener('gamepaddisconnected', scan)
      clearInterval(timer)
    }
  }, [])

  function restoreDefaults() {
    setListening(null)
    if (device === 'keyboard') {
      setKeyboard({ ...DEFAULT_KEYBOARD_BINDS })
      resetKeyboardBinds()
    } else {
      setGamepad({ ...DEFAULT_GAMEPAD_BINDS })
      resetGamepadBinds()
    }
  }

  const values = Object.fromEntries(
    RETROPAD_BUTTONS.map((b) => [
      b,
      device === 'keyboard' ? formatRetroKey(keyboard[b]) : `#${gamepad[b]}`,
    ]),
  ) as Record<RetroButton, string>

  return (
    <Panel>
      <SectionLabel>Arcade controls</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Remap the keyboard and controller used in the Arcade. Click a button,
        then press the key or pad button you want. Saved on this device.
      </p>

      <div className="mt-4 flex gap-2">
        {(
          [
            ['keyboard', 'Keyboard', Keyboard],
            ['gamepad', 'Gamepad', Gamepad2],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setDevice(value)
              setListening(null)
            }}
            className={cn(
              'flex items-center gap-2 border px-3 py-2 font-mono text-xs tracking-widest uppercase',
              device === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {device === 'gamepad' && (
        <p className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Controller:{' '}
          <span className={cn(padName ? 'text-primary' : 'text-destructive')}>
            {padName ?? 'none detected — plug in & press a button'}
          </span>
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-3">
          <GamepadDiagram
            values={values}
            activeButton={listening}
            onPick={setListening}
          />
          {device === 'keyboard' && <KeyboardDiagram binds={keyboard} />}
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Key mapping
          </p>
          <ul className="grid gap-1.5">
            {RETROPAD_BUTTONS.map((button) => {
              const active = listening === button
              return (
                <li
                  key={button}
                  className="flex items-center justify-between gap-3 border border-border px-3 py-2"
                >
                  <span className="font-mono text-xs tracking-wide uppercase">
                    {BUTTON_META[button].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setListening(active ? null : button)}
                    aria-label={`Rebind ${BUTTON_META[button].label}`}
                    className={cn(
                      'min-w-28 border px-3 py-1 text-center font-mono text-xs uppercase',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {active
                      ? device === 'keyboard'
                        ? 'Press a key…'
                        : 'Press a button…'
                      : values[button]}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={restoreDefaults}
            className="mt-1 flex w-fit items-center gap-2 border border-border px-3 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
          >
            <RotateCcw className="size-3.5" />
            Restore defaults
          </button>
        </div>
      </div>
    </Panel>
  )
}
