import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import type { PublicUser } from '@/core/schemas'
import { DevModeSwitcher } from './dev-mode-switcher'

const freeUser: PublicUser = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'A',
  totpEnabled: false,
  role: 'user',
  tier: 'free',
}
const admin: PublicUser = { ...freeUser, role: 'admin', tier: 'pro' }

function ctx(user: PublicUser | null, over: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user,
    loading: false,
    register: async () => {},
    login: async () => {},
    recover: async () => {},
    logout: async () => {},
    refresh: async () => {},
    ...over,
  }
}

function renderSwitch(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <DevModeSwitcher />
    </AuthContext.Provider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('DevModeSwitcher', () => {
  it('renders all four positions under a "Dev Mode" label', () => {
    renderSwitch(ctx(null))
    expect(screen.getByText('Dev Mode')).toBeInTheDocument()
    for (const label of ['Off', 'Unpaid', 'Paid', 'Admin']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('collapses to just the label when "Dev Mode" is clicked, and restores', async () => {
    renderSwitch(ctx(null))
    const label = screen.getByRole('button', { name: /dev mode/i })
    // Collapse: the role buttons disappear, the label stays.
    await userEvent.click(label)
    expect(screen.queryByRole('button', { name: 'Off' })).not.toBeInTheDocument()
    expect(label).toHaveAttribute('aria-expanded', 'false')
    // Restore.
    await userEvent.click(label)
    expect(screen.getByRole('button', { name: 'Off' })).toBeInTheDocument()
    expect(label).toHaveAttribute('aria-expanded', 'true')
  })

  it('marks Off active when logged out', () => {
    renderSwitch(ctx(null))
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks Admin active for an admin user', () => {
    renderSwitch(ctx(admin))
    expect(screen.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking Off signs the user out', async () => {
    const logout = vi.fn(async () => {})
    renderSwitch(ctx(freeUser, { logout }))
    await userEvent.click(screen.getByRole('button', { name: 'Off' }))
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
  })

  it('clicking a role posts to the dev endpoint and refreshes auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const refresh = vi.fn(async () => {})
    renderSwitch(ctx(null, { refresh }))

    await userEvent.click(screen.getByRole('button', { name: 'Paid' }))

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/me/become',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ role: 'paid' }),
      }),
    )
  })

  it('surfaces an error and does not refresh when the endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const refresh = vi.fn(async () => {})
    renderSwitch(ctx(null, { refresh }))

    await userEvent.click(screen.getByRole('button', { name: 'Paid' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/failed/i))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does nothing when clicking the already-active position', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const logout = vi.fn(async () => {})
    renderSwitch(ctx(null, { logout }))

    await userEvent.click(screen.getByRole('button', { name: 'Off' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })
})
