import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { SignInPage } from './sign-in'
import { SignUpPage } from './sign-up'

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    register: vi.fn(async () => {}),
    login: vi.fn(async () => {}),
    recover: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
    ...overrides,
  }
}

function renderWith(ui: ReactNode, ctx = auth()) {
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
  return ctx
}

describe('SignInPage', () => {
  it('shows only the email field — password is commented out', () => {
    renderWith(<SignInPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('logs in with the entered email', async () => {
    const ctx = renderWith(<SignInPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(ctx.login).toHaveBeenCalledWith('ada@example.com')
  })

  it('recovery toggle reveals a code field and calls recover', async () => {
    const ctx = renderWith(<SignInPage />)
    await userEvent.click(
      screen.getByRole('button', { name: /lost your passkey/i }),
    )
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(
      screen.getByLabelText(/authenticator code/i),
      '123456',
    )
    await userEvent.click(screen.getByRole('button', { name: /verify code/i }))
    expect(ctx.recover).toHaveBeenCalledWith('ada@example.com', '123456')
  })
})

describe('SignUpPage', () => {
  it('shows name + email only — username/password are commented out', () => {
    renderWith(<SignUpPage />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument()
  })

  it('registers with the email and full name', async () => {
    const ctx = renderWith(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )
    expect(ctx.register).toHaveBeenCalledWith('ada@example.com', 'Ada Lovelace')
  })
})
