import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_KEYBOARD_BINDS } from '@/core/controls'
import {
  loadGamepadBinds,
  loadKeyboardBinds,
  resetKeyboardBinds,
  saveGamepadBinds,
  saveKeyboardBinds,
} from './controls-store'

afterEach(() => localStorage.clear())

describe('keyboard binds store', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadKeyboardBinds()).toEqual(DEFAULT_KEYBOARD_BINDS)
  })

  it('round-trips a saved change', () => {
    saveKeyboardBinds({ ...DEFAULT_KEYBOARD_BINDS, a: 'l' })
    expect(loadKeyboardBinds().a).toBe('l')
  })

  it('merges partial saved data over defaults', () => {
    localStorage.setItem('fw:arcade:keyboard-binds', JSON.stringify({ b: 'm' }))
    const binds = loadKeyboardBinds()
    expect(binds.b).toBe('m')
    expect(binds.start).toBe(DEFAULT_KEYBOARD_BINDS.start)
  })

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem('fw:arcade:keyboard-binds', 'not json{')
    expect(loadKeyboardBinds()).toEqual(DEFAULT_KEYBOARD_BINDS)
  })

  it('reset clears the override', () => {
    saveKeyboardBinds({ ...DEFAULT_KEYBOARD_BINDS, a: 'l' })
    resetKeyboardBinds()
    expect(loadKeyboardBinds()).toEqual(DEFAULT_KEYBOARD_BINDS)
  })
})

describe('gamepad binds store', () => {
  it('round-trips a saved button index', () => {
    saveGamepadBinds({ ...loadGamepadBinds(), a: 3 })
    expect(loadGamepadBinds().a).toBe(3)
  })

  it('ignores a non-numeric saved value', () => {
    localStorage.setItem(
      'fw:arcade:gamepad-binds',
      JSON.stringify({ a: 'nope' }),
    )
    expect(loadGamepadBinds().a).toBe(1)
  })
})
