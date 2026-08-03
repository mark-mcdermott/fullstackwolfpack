import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { SidebarContent } from './sidebar-content'

const auth: AuthContextValue = {
  user: null,
  loading: false,
  register: async () => {},
  login: async () => {},
  recover: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

function renderSidebar(onNavigate?: () => void) {
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <SidebarContent onNavigate={onNavigate} />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('SidebarContent brand block', () => {
  it('links the brand block to the dashboard', () => {
    renderSidebar()
    const brand = screen.getByRole('link', { name: /fullstack wolfpack home/i })
    expect(brand).toHaveAttribute('href', '/app')
    // The FW-01 badge, wolf mark and wordmark all live inside that one link.
    expect(brand).toHaveTextContent('FW-01')
    expect(brand).toHaveTextContent('FULLSTACK WOLFPACK')
  })

  it('closes the mobile drawer when the brand is tapped', async () => {
    const onNavigate = vi.fn()
    renderSidebar(onNavigate)
    await userEvent.click(
      screen.getByRole('link', { name: /fullstack wolfpack home/i }),
    )
    expect(onNavigate).toHaveBeenCalledOnce()
  })
})
