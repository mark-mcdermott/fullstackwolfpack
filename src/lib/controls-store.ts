import { z } from 'zod'
import {
  DEFAULT_GAMEPAD_BINDS,
  DEFAULT_KEYBOARD_BINDS,
  type GamepadBinds,
  type KeyboardBinds,
  RETROPAD_BUTTONS,
} from '@/core/controls'

// Arcade input bindings live client-side — they belong to the device's keyboard
// and controller, not the account — so localStorage (works offline in the
// Capacitor/Tauri shells too), not the API.
const KEYBOARD_KEY = 'fw:arcade:keyboard-binds'
const GAMEPAD_KEY = 'fw:arcade:gamepad-binds'

const keyboardStored = z.record(z.string(), z.string().min(1))
const gamepadStored = z.record(z.string(), z.number().int().min(0))

function readJson(key: string): unknown {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked — bindings just won't persist this session.
  }
}

export function loadKeyboardBinds(): KeyboardBinds {
  const parsed = keyboardStored.safeParse(readJson(KEYBOARD_KEY))
  const saved = parsed.success ? parsed.data : {}
  const binds = { ...DEFAULT_KEYBOARD_BINDS }
  for (const button of RETROPAD_BUTTONS) {
    const value = saved[button]
    if (typeof value === 'string' && value) binds[button] = value
  }
  return binds
}

export function loadGamepadBinds(): GamepadBinds {
  const parsed = gamepadStored.safeParse(readJson(GAMEPAD_KEY))
  const saved = parsed.success ? parsed.data : {}
  const binds = { ...DEFAULT_GAMEPAD_BINDS }
  for (const button of RETROPAD_BUTTONS) {
    const value = saved[button]
    if (typeof value === 'number') binds[button] = value
  }
  return binds
}

export function saveKeyboardBinds(binds: KeyboardBinds): void {
  writeJson(KEYBOARD_KEY, binds)
}

export function saveGamepadBinds(binds: GamepadBinds): void {
  writeJson(GAMEPAD_KEY, binds)
}

export function resetKeyboardBinds(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEYBOARD_KEY)
}

export function resetGamepadBinds(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(GAMEPAD_KEY)
}
