import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { MobileNav } from './mobile-nav'

const auth: AuthContextValue = {
  user: null,
  loading: false,
  register: async () => {},
  login: async () => {},
  recover: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

function renderNav() {
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('MobileNav drawer', () => {
  it('renders the full desktop sidebar body once opened', async () => {
    renderNav()
    // Closed: none of the sidebar body is present.
    expect(screen.queryByText('FULLSTACK WOLFPACK')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))

    // Brand block + status panel (the pieces the old drawer was missing) +
    // the nav + sign-out — i.e. the same body the desktop sidebar shows.
    expect(screen.getByText('FULLSTACK WOLFPACK')).toBeInTheDocument()
    expect(screen.getByText('ウルフパック')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /dashboard/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument()
  })

  it('closes when a nav link is tapped', async () => {
    renderNav()
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await userEvent.click(screen.getByRole('link', { name: /sessions/i }))
    expect(screen.queryByText('FULLSTACK WOLFPACK')).not.toBeInTheDocument()
  })
})
