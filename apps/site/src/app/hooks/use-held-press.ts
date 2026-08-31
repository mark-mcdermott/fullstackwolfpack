import { useEffect, useMemo, type RefObject } from 'react'
import type { EmulatorSession } from '@/lib/emulator'
import { createHeldPress } from '@/lib/held-press'

// `onDown`/`onUp` for the on-screen pad, wired to the live emulator session and
// holding each press long enough for the emulator to sample it (see
// `lib/held-press`). Stable across renders, so TouchControls' own
// release-on-unmount effects don't re-run.
export function useHeldPress(session: RefObject<EmulatorSession | null>) {
  const press = useMemo(
    () =>
      createHeldPress(
        (button) => session.current?.pressDown(button),
        (button) => session.current?.pressUp(button),
      ),
    [session],
  )

  useEffect(() => press.flush, [press])

  return press
}
