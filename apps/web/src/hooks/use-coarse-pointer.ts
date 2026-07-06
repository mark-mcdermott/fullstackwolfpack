import { useEffect, useState } from 'react'

// True on touch / coarse-pointer devices (phones, tablets), where the emulator
// has no physical input and the on-screen gamepad is needed. Reactive to a
// pointer change (e.g. a 2-in-1 docking). Safe on the server / in tests, where
// `matchMedia` is absent → stays false, so the overlay only appears on touch.
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(pointer: coarse)')
    setCoarse(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return coarse
}
