import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

// Fullscreen the game surface with one button. Returns a `ref` to attach to the
// element to expand and a `toggle` to enter/exit. Handles the Safari/WebKit
// vendor-prefixed API; `supported` is false where the Fullscreen API isn't
// available (e.g. iOS Safari on non-video), so callers can hide the control.

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenEnabled?: boolean
}

function fsElement(): Element | null {
  if (typeof document === 'undefined') return null
  const d = document as FsDocument
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null
}

function exitFs(): void {
  const d = document as FsDocument
  if (d.exitFullscreen) void d.exitFullscreen()
  else if (d.webkitExitFullscreen) void d.webkitExitFullscreen()
}

function requestFs(el: FsElement): void {
  const run = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
  if (!run) return
  // requestFullscreen rejects if the gesture is stale / disallowed — ignore.
  Promise.resolve(run()).catch(() => {})
}

export function useFullscreen<T extends HTMLElement>(): {
  ref: RefObject<T | null>
  isFullscreen: boolean
  supported: boolean
  toggle: () => void
} {
  const ref = useRef<T>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const supported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled || (document as FsDocument).webkitFullscreenEnabled || false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(fsElement() === ref.current)
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const toggle = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (fsElement()) exitFs()
    else requestFs(el)
  }, [])

  return { ref, isFullscreen, supported, toggle }
}
