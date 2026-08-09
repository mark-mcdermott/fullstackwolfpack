import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

// Fullscreen the game surface with one button. Returns a `ref` to attach to the
// element to expand and a `toggle` to enter/exit.
//
// iPhone Safari has no element-fullscreen API at all — `fullscreenEnabled` and
// `webkitFullscreenEnabled` are both false there, and only <video> can go
// fullscreen. That used to hide the button outright, which read as the feature
// having disappeared on exactly the device that needs it most.
//
// So where the API is missing we fall back to `immersive`: the caller pins the
// surface to the viewport with CSS instead. Callers apply `immersive` as a
// class and can otherwise treat `isFullscreen` as one flag for both paths.

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
  // True only on the CSS fallback path, so the caller knows to pin the element
  // itself; the native path needs no styling of its own.
  immersive: boolean
  supported: boolean
  toggle: () => void
} {
  const ref = useRef<T>(null)
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [immersive, setImmersive] = useState(false)

  const nativeSupported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled || (document as FsDocument).webkitFullscreenEnabled || false)

  useEffect(() => {
    const onChange = () => setNativeFullscreen(fsElement() === ref.current)
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // While immersive, the page behind must not scroll — a stray drag otherwise
  // slides the surface off screen with no way back to it.
  useEffect(() => {
    if (!immersive) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [immersive])

  const toggle = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (!nativeSupported) {
      setImmersive((v) => !v)
      return
    }
    if (fsElement()) exitFs()
    else requestFs(el)
  }, [nativeSupported])

  return {
    ref,
    isFullscreen: nativeSupported ? nativeFullscreen : immersive,
    immersive: !nativeSupported && immersive,
    // Always offered now: one path or the other always works.
    supported: true,
    toggle,
  }
}
