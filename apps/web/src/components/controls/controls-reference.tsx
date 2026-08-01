import { useState } from 'react'
import {
  formatRetroKey,
  type RetroButton,
  RETROPAD_BUTTONS,
} from '@/core/controls'
import { loadKeyboardBinds } from '@/lib/controls-store'
import { GamepadDiagram } from './gamepad-diagram'
import { KeyboardDiagram } from './keyboard-diagram'

// Read-only cheat-sheet shown inside the player. Reflects the user's saved
// keyboard mapping (the controller mirrors the same buttons). `compact` drops
// the keyboard map for surfaces that just need the pad (the arcade landing).
export function ControlsReference({ compact = false }: { compact?: boolean }) {
  const [keyboard] = useState(loadKeyboardBinds)
  const values = Object.fromEntries(
    RETROPAD_BUTTONS.map((b) => [b, formatRetroKey(keyboard[b])]),
  ) as Record<RetroButton, string>

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <GamepadDiagram values={values} />
      {!compact && <KeyboardDiagram binds={keyboard} />}
    </div>
  )
}
