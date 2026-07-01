import { describe, expect, it } from 'vitest'
import {
  bindsToRetroarchConfig,
  BUTTON_META,
  DEFAULT_GAMEPAD_BINDS,
  DEFAULT_KEYBOARD_BINDS,
  formatRetroKey,
  gamepadBindsToConfig,
  keyboardBindsToConfig,
  RETROPAD_BUTTONS,
  retroKeyFromCode,
} from './controls'

describe('defaults', () => {
  it('every RetroPad button has metadata and keyboard + gamepad defaults', () => {
    for (const button of RETROPAD_BUTTONS) {
      expect(BUTTON_META[button]).toBeDefined()
      expect(DEFAULT_KEYBOARD_BINDS[button]).toMatch(/\S/)
      expect(typeof DEFAULT_GAMEPAD_BINDS[button]).toBe('number')
    }
  })

  it('matches RetroArch keyboard defaults', () => {
    expect(DEFAULT_KEYBOARD_BINDS.b).toBe('z')
    expect(DEFAULT_KEYBOARD_BINDS.a).toBe('x')
    expect(DEFAULT_KEYBOARD_BINDS.start).toBe('enter')
    expect(DEFAULT_KEYBOARD_BINDS.select).toBe('rshift')
    expect(DEFAULT_KEYBOARD_BINDS.up).toBe('up')
  })
})

describe('retroKeyFromCode', () => {
  it('maps letters, digits, arrows, and named keys', () => {
    expect(retroKeyFromCode('KeyZ')).toBe('z')
    expect(retroKeyFromCode('Digit5')).toBe('5')
    expect(retroKeyFromCode('ArrowUp')).toBe('up')
    expect(retroKeyFromCode('Enter')).toBe('enter')
    expect(retroKeyFromCode('ShiftRight')).toBe('rshift')
    expect(retroKeyFromCode('Space')).toBe('space')
    expect(retroKeyFromCode('F8')).toBe('f8')
  })

  it('returns null for keys we do not support binding', () => {
    expect(retroKeyFromCode('MediaPlayPause')).toBeNull()
    expect(retroKeyFromCode('F13')).toBeNull()
    expect(retroKeyFromCode('')).toBeNull()
  })
})

describe('formatRetroKey', () => {
  it('renders friendly labels with an uppercase fallback', () => {
    expect(formatRetroKey('up')).toBe('↑')
    expect(formatRetroKey('rshift')).toBe('R-Shift')
    expect(formatRetroKey('enter')).toBe('Enter')
    expect(formatRetroKey('z')).toBe('Z')
    expect(formatRetroKey('f8')).toBe('F8')
  })
})

describe('binds → retroarch config', () => {
  it('emits keyboard input_player1_* entries', () => {
    const config = keyboardBindsToConfig(DEFAULT_KEYBOARD_BINDS)
    expect(config.input_player1_b).toBe('z')
    expect(config.input_player1_up).toBe('up')
    expect(config.input_player1_start).toBe('enter')
  })

  it('emits gamepad *_btn entries as strings', () => {
    const config = gamepadBindsToConfig(DEFAULT_GAMEPAD_BINDS)
    expect(config.input_player1_b_btn).toBe('0')
    expect(config.input_player1_start_btn).toBe('9')
    expect(config.input_player1_up_btn).toBe('12')
  })

  it('combines both device maps for launch', () => {
    const config = bindsToRetroarchConfig(
      DEFAULT_KEYBOARD_BINDS,
      DEFAULT_GAMEPAD_BINDS,
    )
    expect(config.input_player1_a).toBe('x')
    expect(config.input_player1_a_btn).toBe('1')
  })
})
