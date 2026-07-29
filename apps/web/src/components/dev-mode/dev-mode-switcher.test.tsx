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

// The collapse toggle — named "User" collapsed, "Test User" expanded (both
// match /user/i, and no role button does).
const labelButton = () => screen.getByRole('button', { name: /user/i })
// The switcher loads collapsed; expand it to reach the role buttons.
async function expand() {
  await userEvent.click(labelButton())
}

afterEach(() => vi.unstubAllGlobals())

describe('DevModeSwitcher', () => {
  it('loads collapsed as just a "User" label, no role buttons', () => {
    renderSwitch(ctx(null))
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(labelButton()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'None' })).not.toBeInTheDocument()
  })

  it('renders all four positions under a "Test User" label once expanded', async () => {
    renderSwitch(ctx(null))
    await expand()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    for (const label of ['None', 'Unpaid', 'Paid', 'Admin']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('expands and collapses again when the label is clicked', async () => {
    renderSwitch(ctx(null))
    const label = labelButton()
    // Expand: the role buttons appear.
    await userEvent.click(label)
    expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument()
    expect(label).toHaveAttribute('aria-expanded', 'true')
    // Collapse: they disappear, the label stays.
    await userEvent.click(label)
    expect(screen.queryByRole('button', { name: 'None' })).not.toBeInTheDocument()
    expect(label).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks None active when logged out', async () => {
    renderSwitch(ctx(null))
    await expand()
    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks Admin active for an admin user', async () => {
    renderSwitch(ctx(admin))
    await expand()
    expect(screen.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking None signs the user out', async () => {
    const logout = vi.fn(async () => {})
    renderSwitch(ctx(freeUser, { logout }))
    await expand()
    await userEvent.click(screen.getByRole('button', { name: 'None' }))
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
  })

  it('clicking a role posts to the dev endpoint and refreshes auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const refresh = vi.fn(async () => {})
    renderSwitch(ctx(null, { refresh }))
    await expand()

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
    await expand()

    await userEvent.click(screen.getByRole('button', { name: 'Paid' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/failed/i))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does nothing when clicking the already-active position', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const logout = vi.fn(async () => {})
    renderSwitch(ctx(null, { logout }))
    await expand()

    await userEvent.click(screen.getByRole('button', { name: 'None' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })
})
