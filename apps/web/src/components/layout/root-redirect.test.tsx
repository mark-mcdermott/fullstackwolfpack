import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SITE_URL } from '@/consts'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import type { PublicUser } from '@/core/schemas'
import { RootRedirect } from './root-redirect'

const replace = vi.fn()
let original: Location

beforeEach(() => {
  replace.mockReset()
  original = window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...original, replace },
  })
})
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: original })
})

const user: PublicUser = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'A',
  totpEnabled: false,
  role: 'user',
  tier: 'free',
}

function renderAt(ctxUser: PublicUser | null) {
  const value: AuthContextValue = {
    user: ctxUser,
    loading: false,
    register: async () => {},
    login: async () => {},
    recover: async () => {},
    logout: async () => {},
    refresh: async () => {},
  }
  const ui: ReactNode = (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/app" element={<div>APP HOME</div>} />
      <Route path="/login" element={<div>LOGIN</div>} />
    </Routes>
  )
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RootRedirect', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sends signed-out visitors to the public site in production', () => {
    vi.stubEnv('DEV', false) // production build
    renderAt(null)
    expect(replace).toHaveBeenCalledWith(SITE_URL)
  })

  it('keeps signed-out visitors on /login in dev (no external bounce)', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_SITE_URL', '') // no override → stay local
    renderAt(null)
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('honors VITE_SITE_URL even in dev', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_SITE_URL', 'http://localhost:4321')
    renderAt(null)
    expect(replace).toHaveBeenCalled()
  })

  it('sends signed-in users to /app', () => {
    renderAt(user)
    expect(screen.getByText('APP HOME')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })
})
