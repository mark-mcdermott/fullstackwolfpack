import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from '@/hooks/auth-context'
import { AchievementsPage } from '@/pages/app/achievements'
import { DashboardPage } from '@/pages/app/dashboard'
import { SettingsPage } from '@/pages/app/settings'
import { TopicsPage } from '@/pages/app/topics'
import { AdminUsersPage } from '@/pages/admin/users'
import { Blog } from '@/pages/public/blog'
import { Home } from '@/pages/public/home'
import { Pricing } from '@/pages/public/pricing'

const adminUser: AuthUser = {
  id: 'u1',
  email: 'mark@x.com',
  displayName: 'Mark',
  totpEnabled: false,
  role: 'admin',
  tier: 'pro',
}

function auth(user: AuthUser | null): AuthContextValue {
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

function renderPage(ui: ReactNode, user: AuthUser | null = adminUser) {
  return render(
    <AuthContext.Provider value={auth(user)}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
}

// Slim regression set: every top-level page renders without crashing and shows
// its signature content.
describe('public pages render', () => {
  it('home', () => {
    renderPage(<Home />)
    expect(screen.getByText(/why it works/i)).toBeInTheDocument()
  })
  it('pricing lists both plans', () => {
    renderPage(<Pricing />)
    expect(screen.getByText('Recruit')).toBeInTheDocument()
    expect(screen.getByText('Wolf')).toBeInTheDocument()
  })
  it('blog', () => {
    renderPage(<Blog />)
    expect(screen.getByText('Wolfpack Blog')).toBeInTheDocument()
  })
})

describe('app pages render', () => {
  it('dashboard', () => {
    renderPage(<DashboardPage />)
    expect(screen.getByText(/recent lessons/i)).toBeInTheDocument()
  })
  it('topics', () => {
    renderPage(<TopicsPage />)
    expect(screen.getByText('React')).toBeInTheDocument()
  })
  it('achievements', () => {
    renderPage(<AchievementsPage />)
    expect(screen.getByText('Week Warrior')).toBeInTheDocument()
  })
  it('settings shows billing', () => {
    renderPage(<SettingsPage />)
    expect(screen.getByText(/billing/i)).toBeInTheDocument()
  })
  it('admin lists users', () => {
    renderPage(<AdminUsersPage />)
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
  })
})
