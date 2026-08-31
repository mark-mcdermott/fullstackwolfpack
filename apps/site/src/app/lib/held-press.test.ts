import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHeldPress, MIN_PRESS_MS } from './held-press'

function setup(minMs = MIN_PRESS_MS) {
  const down = vi.fn()
  const up = vi.fn()
  return { down, up, press: createHeldPress(down, up, minMs) }
}

describe('createHeldPress', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  // The bug this exists for: a tap on the on-screen pad puts pointerdown and
  // pointerup in the same emulated frame, and RetroArch — which samples input
  // once per frame — never saw the button at all.
  it('holds an instant tap for the minimum press, so the emulator can sample it', () => {
    const { down, up, press } = setup()

    press.down('a')
    press.up('a')

    expect(down).toHaveBeenCalledWith('a')
    expect(up).not.toHaveBeenCalled()

    vi.advanceTimersByTime(MIN_PRESS_MS)
    expect(up).toHaveBeenCalledWith('a')
  })

  it('releases a real hold as soon as the finger lifts', () => {
    const { up, press } = setup()

    press.down('right')
    vi.advanceTimersByTime(MIN_PRESS_MS + 500)
    press.up('right')

    expect(up).toHaveBeenCalledWith('right')
  })

  it('keeps a button held while the finger stays down', () => {
    const { up, press } = setup()

    press.down('left')
    vi.advanceTimersByTime(5000)

    expect(up).not.toHaveBeenCalled()
  })

  it('ignores a repeat press of a button already held', () => {
    const { down, press } = setup()

    press.down('b')
    vi.advanceTimersByTime(MIN_PRESS_MS + 50)
    press.down('b')

    expect(down).toHaveBeenCalledTimes(1)
  })

  // Mashing a button faster than the minimum hold must read as separate
  // presses, not collapse into one long one.
  it('replays a tap that arrives mid-hold', () => {
    const { down, up, press } = setup()

    press.down('a')
    press.up('a')
    vi.advanceTimersByTime(20)
    press.down('a') // mashed again before the first press was released
    press.up('a')

    vi.advanceTimersByTime(MIN_PRESS_MS)
    expect(up).toHaveBeenCalledTimes(1)
    expect(down).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(MIN_PRESS_MS)
    expect(up).toHaveBeenCalledTimes(2)
  })

  it('holds several buttons independently', () => {
    const { down, up, press } = setup()

    press.down('left')
    press.down('a')
    press.up('a')
    vi.advanceTimersByTime(MIN_PRESS_MS)

    expect(down.mock.calls.map(([b]) => b)).toEqual(['left', 'a'])
    expect(up.mock.calls.map(([b]) => b)).toEqual(['a'])
  })

  it('flush releases everything still held and cancels pending releases', () => {
    const { up, press } = setup()

    press.down('left')
    press.down('a')
    press.up('a') // release pending

    press.flush()
    expect(up.mock.calls.map(([b]) => b).sort()).toEqual(['a', 'left'])

    vi.advanceTimersByTime(MIN_PRESS_MS * 2)
    expect(up).toHaveBeenCalledTimes(2)
  })

  it('ignores a release for a button that was never pressed', () => {
    const { up, press } = setup()

    press.up('start')
    vi.advanceTimersByTime(MIN_PRESS_MS)

    expect(up).not.toHaveBeenCalled()
  })
})
