import type { RetroButton } from '@/core/controls'

// RetroArch samples input once per emulated frame (~16.7ms at 60fps). A press
// that goes down and back up inside a single frame is never sampled, so it is
// dropped outright — and that is exactly what a tap on the on-screen pad
// produces: pointerdown and pointerup land in the same frame, so the game sees
// nothing at all. Measured on an iPhone profile in WebKit: 20 taps of START sat
// on the title screen, while two 250ms holds walked straight into the menu.
//
// So every press is held for at least this long before it is released,
// regardless of how briefly the finger was down. Short enough to feel instant,
// long enough to span several frames.
export const MIN_PRESS_MS = 100

type Press = (button: RetroButton) => void

type Pending = {
  at: number
  // Whether the finger is still on the button. A release that arrives during
  // the minimum hold is remembered here rather than acted on.
  fingerDown: boolean
  timer: ReturnType<typeof setTimeout> | null
  // A fresh press arrived while this one was still serving out its hold.
  replay: boolean
}

export type HeldPress = {
  down: Press
  up: Press
  // Release everything immediately — a held button must not outlive the pad.
  flush: () => void
}

export function createHeldPress(
  pressDown: Press,
  pressUp: Press,
  minMs = MIN_PRESS_MS,
): HeldPress {
  const pending = new Map<RetroButton, Pending>()

  function down(button: RetroButton) {
    const state = pending.get(button)
    if (!state) {
      pending.set(button, {
        at: Date.now(),
        fingerDown: true,
        timer: null,
        replay: false,
      })
      pressDown(button)
      return
    }
    state.fingerDown = true
    // Mid-hold: replay the press once this one ends, so mashing a button reads
    // as separate presses instead of collapsing into one long one.
    if (state.timer) state.replay = true
  }

  function up(button: RetroButton) {
    const state = pending.get(button)
    if (!state) return
    state.fingerDown = false
    if (state.timer) return

    const remaining = minMs - (Date.now() - state.at)
    if (remaining <= 0) {
      settle(button)
      return
    }
    state.timer = setTimeout(() => settle(button), remaining)
  }

  function settle(button: RetroButton) {
    const state = pending.get(button)
    if (!state) return
    if (state.timer) clearTimeout(state.timer)
    pending.delete(button)
    pressUp(button)

    if (state.replay) {
      down(button)
      if (!state.fingerDown) up(button)
    }
  }

  function flush() {
    for (const [button, state] of [...pending]) {
      if (state.timer) clearTimeout(state.timer)
      pending.delete(button)
      pressUp(button)
    }
  }

  return { down, up, flush }
}
