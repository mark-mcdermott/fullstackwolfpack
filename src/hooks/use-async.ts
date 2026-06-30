import { useEffect, useState } from 'react'

// Minimal data-fetching state for the logged-in pages: run an async fn on mount
// (and when `deps` change), exposing loading / data / error. Stale results from
// a superseded run are ignored.

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    fn()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
