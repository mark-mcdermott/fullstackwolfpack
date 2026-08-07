import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import type { PublicUser } from '@/core/schemas'
import { GuestLayout } from './guest-layout'

function authValue(user: PublicUser | null): AuthContextValue {
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

function renderLayout(user: PublicUser | null) {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue(user)}>
        <GuestLayout />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

// Skipped with the guest banner itself, which is commented out in
// guest-layout.tsx. Both cases here are banner assertions — the signed-in one
// would still pass, but only vacuously — so they un-skip together when the
// banner comes back.
describe.skip('GuestLayout', () => {
  it('shows the sign-up banner to guests', () => {
    renderLayout(null)
    expect(screen.getByText(/playing as a guest/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /create a free account/i }),
    ).toBeInTheDocument()
  })

  it('hides the banner for signed-in users', () => {
    renderLayout({
      id: 'u1',
      email: 'a@b.co',
      displayName: 'A',
    } as PublicUser)
    expect(screen.queryByText(/playing as a guest/i)).not.toBeInTheDocument()
  })
})
