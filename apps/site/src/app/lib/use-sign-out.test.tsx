import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { useSignOut } from './use-sign-out'

const assign = vi.fn()
let original: Location

beforeEach(() => {
  assign.mockReset()
  original = window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...original, assign },
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: original })
})

function wrapper(logout: AuthContextValue['logout']) {
  const value: AuthContextValue = {
    user: null,
    loading: false,
    register: async () => {},
    login: async () => {},
    recover: async () => {},
    logout,
    refresh: async () => {},
  }
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

describe('useSignOut', () => {
  it('logs out, then returns to the in-app front door (/)', async () => {
    const order: string[] = []
    const logout = vi.fn(async () => {
      order.push('logout')
    })
    assign.mockImplementation(() => order.push('assign'))

    const { result } = renderHook(() => useSignOut(), {
      wrapper: wrapper(logout),
    })
    await result.current()

    expect(logout).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('/')
    expect(order).toEqual(['logout', 'assign']) // log out before leaving
  })
})
