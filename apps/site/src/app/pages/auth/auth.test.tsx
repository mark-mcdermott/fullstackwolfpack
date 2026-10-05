import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { SignInPage } from './sign-in'
import { SignUpPage } from './sign-up'

const GOOD_PASSWORD = 'correct-horse-battery'

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    signUp: vi.fn(async () => {}),
    signIn: vi.fn(async () => {}),
    requestPasswordReset: vi.fn(async () => {}),
    resetPassword: vi.fn(async () => {}),
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
  it('asks for an email and a password', () => {
    renderWith(<SignInPage />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('signs in with the entered credentials', async () => {
    const ctx = renderWith(<SignInPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(screen.getByLabelText('Password'), GOOD_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(ctx.signIn).toHaveBeenCalledWith('ada@example.com', GOOD_PASSWORD)
  })

  it('forgot-password hides the password field and requests a reset', async () => {
    const ctx = renderWith(<SignInPage />)
    await userEvent.click(
      screen.getByRole('button', { name: /forgot password/i }),
    )
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.click(
      screen.getByRole('button', { name: /email me a reset link/i }),
    )
    expect(ctx.requestPasswordReset).toHaveBeenCalledWith('ada@example.com')
  })

  it('confirms a reset without revealing whether the account exists', async () => {
    renderWith(<SignInPage />)
    await userEvent.click(
      screen.getByRole('button', { name: /forgot password/i }),
    )
    await userEvent.type(screen.getByLabelText('Email'), 'nobody@example.com')
    await userEvent.click(
      screen.getByRole('button', { name: /email me a reset link/i }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      /if an account uses that address/i,
    )
  })
})

describe('SignUpPage', () => {
  it('asks for name, email, password and confirmation', () => {
    renderWith(<SignUpPage />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument()
  })

  it('signs up with the email, password and full name', async () => {
    const ctx = renderWith(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'ada@example.com',
    )
    await userEvent.type(screen.getByLabelText('Password'), GOOD_PASSWORD)
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      GOOD_PASSWORD,
    )
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )
    expect(ctx.signUp).toHaveBeenCalledWith(
      'ada@example.com',
      GOOD_PASSWORD,
      'Ada Lovelace',
    )
  })

  it('refuses mismatched passwords without calling signUp', async () => {
    const ctx = renderWith(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'ada@example.com',
    )
    await userEvent.type(screen.getByLabelText('Password'), GOOD_PASSWORD)
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'something-else-entirely',
    )
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /do not match/i,
    )
    expect(ctx.signUp).not.toHaveBeenCalled()
  })

  it('refuses a password under the minimum without calling signUp', async () => {
    const ctx = renderWith(<SignUpPage />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'ada@example.com',
    )
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'short')
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(/12 characters/i)
    expect(ctx.signUp).not.toHaveBeenCalled()
  })
})
