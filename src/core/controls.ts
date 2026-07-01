// Pure controls domain — the RetroPad buttons the Arcade exposes, their default
// keyboard/gamepad bindings, and the translation into RetroArch config keys
// (`input_player1_*`) that Nostalgist understands. No DOM, no storage.

export const RETROPAD_BUTTONS = [
  'up',
  'down',
  'left',
  'right',
  'b',
  'a',
  'y',
  'x',
  'l',
  'r',
  'select',
  'start',
] as const

export type RetroButton = (typeof RETROPAD_BUTTONS)[number]

export type ButtonGroup = 'dpad' | 'face' | 'shoulder' | 'system'

export const BUTTON_META: Record<
  RetroButton,
  { label: string; group: ButtonGroup }
> = {
  up: { label: 'D-Pad Up', group: 'dpad' },
  down: { label: 'D-Pad Down', group: 'dpad' },
  left: { label: 'D-Pad Left', group: 'dpad' },
  right: { label: 'D-Pad Right', group: 'dpad' },
  b: { label: 'B', group: 'face' },
  a: { label: 'A', group: 'face' },
  y: { label: 'Y', group: 'face' },
  x: { label: 'X', group: 'face' },
  l: { label: 'L', group: 'shoulder' },
  r: { label: 'R', group: 'shoulder' },
  select: { label: 'Select', group: 'system' },
  start: { label: 'Start', group: 'system' },
}

export type KeyboardBinds = Record<RetroButton, string>
export type GamepadBinds = Record<RetroButton, number>

// RetroArch's built-in keyboard defaults (RetroPad → key name).
export const DEFAULT_KEYBOARD_BINDS: KeyboardBinds = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  b: 'z',
  a: 'x',
  y: 'a',
  x: 's',
  l: 'q',
  r: 'w',
  select: 'rshift',
  start: 'enter',
}

// Standard-gamepad button indices (W3C mapping) → RetroPad. Matches how most
// USB pads report; the Settings editor lets the user re-capture any that differ.
export const DEFAULT_GAMEPAD_BINDS: GamepadBinds = {
  b: 0,
  a: 1,
  y: 2,
  x: 3,
  l: 4,
  r: 5,
  select: 8,
  start: 9,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
}

// KeyboardEvent.code → RetroArch key name.
const KEYCODE_TO_RETRO: Record<string, string> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'enter',
  NumpadEnter: 'kp_enter',
  ShiftLeft: 'lshift',
  ShiftRight: 'rshift',
  ControlLeft: 'lctrl',
  ControlRight: 'rctrl',
  AltLeft: 'lalt',
  AltRight: 'ralt',
  Space: 'space',
  Tab: 'tab',
  Escape: 'escape',
  Backspace: 'backspace',
  CapsLock: 'capslock',
  Minus: 'minus',
  Equal: 'equals',
  BracketLeft: 'leftbracket',
  BracketRight: 'rightbracket',
  Backslash: 'backslash',
  Semicolon: 'semicolon',
  Quote: 'quote',
  Comma: 'comma',
  Period: 'period',
  Slash: 'slash',
  Backquote: 'backquote',
}

// Nicer labels for display; anything else falls back to uppercase.
const RETRO_KEY_LABEL: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  enter: 'Enter',
  kp_enter: 'Num ⏎',
  rshift: 'R-Shift',
  lshift: 'L-Shift',
  rctrl: 'R-Ctrl',
  lctrl: 'L-Ctrl',
  ralt: 'R-Alt',
  lalt: 'L-Alt',
  space: 'Space',
  tab: 'Tab',
  escape: 'Esc',
  backspace: 'Bksp',
  capslock: 'Caps',
  minus: '-',
  equals: '=',
  leftbracket: '[',
  rightbracket: ']',
  backslash: '\\',
  semicolon: ';',
  quote: "'",
  comma: ',',
  period: '.',
  slash: '/',
  backquote: '`',
}

// Resolves a physical key press to a RetroArch key name, or null if we don't
// support binding it (e.g. media keys).
export function retroKeyFromCode(code: string): string | null {
  if (code in KEYCODE_TO_RETRO) return KEYCODE_TO_RETRO[code]
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter) return letter[1].toLowerCase()
  const digit = /^Digit([0-9])$/.exec(code)
  if (digit) return digit[1]
  const fn = /^F([1-9]|1[0-2])$/.exec(code)
  if (fn) return `f${fn[1]}`
  return null
}

export function formatRetroKey(key: string): string {
  return RETRO_KEY_LABEL[key] ?? key.toUpperCase()
}

export function keyboardBindsToConfig(
  binds: KeyboardBinds,
): Record<string, string> {
  const config: Record<string, string> = {}
  for (const button of RETROPAD_BUTTONS) {
    config[`input_player1_${button}`] = binds[button]
  }
  return config
}

export function gamepadBindsToConfig(
  binds: GamepadBinds,
): Record<string, string> {
  const config: Record<string, string> = {}
  for (const button of RETROPAD_BUTTONS) {
    config[`input_player1_${button}_btn`] = String(binds[button])
  }
  return config
}

// The full RetroArch override the player hands Nostalgist — both input devices
// are live at once, so we emit both sets.
export function bindsToRetroarchConfig(
  keyboard: KeyboardBinds,
  gamepad: GamepadBinds,
): Record<string, string> {
  return {
    ...keyboardBindsToConfig(keyboard),
    ...gamepadBindsToConfig(gamepad),
  }
}
