import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAsync } from './use-async'

describe('useAsync', () => {
  it('starts loading, then resolves to data', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(42)
    expect(result.current.error).toBeNull()
  })

  it('captures an error message and clears loading', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(new Error('boom')), []),
    )
    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
