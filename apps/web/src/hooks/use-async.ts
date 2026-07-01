import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal data-fetching state for the logged-in pages: run an async fn on mount,
// exposing loading / data / error, plus `reload()` to re-run it (e.g. from a
// retry button). Stale results from an unmounted component or a superseded
// reload are ignored.

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>(
  fn: () => Promise<T>,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const [nonce, setNonce] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fnRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((e: unknown) => {
        if (!active) return
        setState({
          data: null,
          loading: false,
          error: e instanceof Error ? e.message : 'Something went wrong',
        })
      })
    return () => {
      active = false
    }
  }, [nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, reload }
}
