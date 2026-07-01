import { useEffect, useRef, useState } from 'react'

// Minimal data-fetching state for the logged-in pages: run an async fn once on
// mount, exposing loading / data / error. Stale results from an unmounted
// component are ignored.

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>(fn: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let active = true
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
  }, [])

  return state
}
