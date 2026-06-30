import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from '@/hooks/auth-context'
import { RequireAuth, RequireRole } from './guards'

function ctx(user: AuthUser | null): AuthContextValue {
  return {
    user,
    loading: false,
    register: async () => {},
    login: async () => {},
    recover: async () => {},
    logout: async () => {},
    refresh: async () => {},
  }
}

const freeUser: AuthUser = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'A',
  totpEnabled: false,
  role: 'user',
  tier: 'free',
}
const admin: AuthUser = { ...freeUser, role: 'admin' }

function renderGuards(path: string, value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/app" element={<div>app home</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/secret" element={<div>secret content</div>} />
          </Route>
          <Route element={<RequireRole ability="admin.access" />}>
            <Route path="/admin" element={<div>admin content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RequireAuth', () => {
  it('redirects to login when logged out', () => {
    renderGuards('/secret', ctx(null))
    expect(screen.getByText('login page')).toBeInTheDocument()
  })
  it('renders the route when logged in', () => {
    renderGuards('/secret', ctx(freeUser))
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })
})

describe('RequireRole admin.access', () => {
  it('bounces a non-admin to the app home', () => {
    renderGuards('/admin', ctx(freeUser))
    expect(screen.getByText('app home')).toBeInTheDocument()
  })
  it('lets an admin through', () => {
    renderGuards('/admin', ctx(admin))
    expect(screen.getByText('admin content')).toBeInTheDocument()
  })
})
