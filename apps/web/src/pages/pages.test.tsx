import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { TimerProvider } from '@/hooks/timer-provider'
import type { PublicUser } from '@/core/schemas'

// The app pages fetch through the api-client singleton; stub it with canned
// data so we test rendering, not the network.
vi.mock('@/api-client', () => ({
  api: {
    data: {
      dashboard: async () => ({
        user: { displayName: 'Mark', level: 1, xp: 0, xpToNext: 400, levelPct: 0 },
        stats: {
          streak: 0,
          bestStreak: 0,
          accuracy: 0,
          hoursLearned: 0,
          hoursPlayed: 0,
          lessonsCompleted: 0,
          sessions: 0,
          totalXp: 0,
        },
        focus: [],
        recentLessons: [],
        weekActivity: [],
      }),
      topics: async () => [
        {
          slug: 'react',
          name: 'React',
          category: 'frontend',
          difficulty: 'beginner',
          pct: 0,
          lessonsCompleted: 0,
          lessonsTotal: 0,
        },
      ],
      achievements: async () => ({
        earned: [
          {
            slug: 'week-warrior',
            name: 'Week Warrior',
            description: 'Complete 7 days in a row',
            current: 7,
            target: 7,
            earnedAt: '2025-05-20T00:00:00.000Z',
          },
        ],
        inProgress: [],
        locked: [],
      }),
    },
    integrations: {
      keyStatus: async () => ({ hasKey: false }),
      saveOpenAiKey: async () => ({ hasKey: true }),
      anthropicKeyStatus: async () => ({ hasKey: false }),
      saveAnthropicKey: async () => ({ hasKey: true }),
    },
    courses: {
      enroll: async () => ({ courseId: 'course-1' }),
      generationEta: async () => ({ etaMs: 20000, samples: 0 }),
    },
    arcade: {
      playtime: async () => [],
      recordPlaytime: async () => ({ seconds: 0 }),
    },
    preferences: {
      get: async () => ({
        askSkillLevel: false,
        askCoverage: false,
        linkifyTerms: false,
      }),
      save: async () => ({
        askSkillLevel: false,
        askCoverage: false,
        linkifyTerms: false,
      }),
    },
    admin: {
      users: async () => [
        {
          id: 'u1',
          email: 'grace@example.com',
          displayName: 'Grace Hopper',
          role: 'user',
          tier: 'free',
          xp: 0,
          level: 1,
        },
      ],
      updateUser: async () => {},
    },
  },
}))
import { AchievementsPage } from '@/pages/app/achievements'
import { ArcadePage } from '@/pages/app/arcade'
import { CreditsPage } from '@/pages/app/credits'
import { DashboardPage } from '@/pages/app/dashboard'
import { SettingsPage } from '@/pages/app/settings'
import { TopicsPage } from '@/pages/app/topics'
import { AdminUsersPage } from '@/pages/admin/users'

const adminUser: PublicUser = {
  id: 'u1',
  email: 'mark@x.com',
  displayName: 'Mark',
  totpEnabled: false,
  role: 'admin',
  tier: 'pro',
}

function auth(user: PublicUser | null): AuthContextValue {
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

function renderPage(ui: ReactNode, user: PublicUser | null = adminUser) {
  return render(
    <AuthContext.Provider value={auth(user)}>
      <TimerProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TimerProvider>
    </AuthContext.Provider>,
  )
}

// Slim regression set: every top-level page renders without crashing and shows
// its signature content.
describe('app pages render', () => {
  it('dashboard', async () => {
    renderPage(<DashboardPage />)
    expect(await screen.findByText(/recent lessons/i)).toBeInTheDocument()
  })
  it('topics', async () => {
    renderPage(<TopicsPage />)
    expect(await screen.findByText('React')).toBeInTheDocument()
  })
  it('arcade features the single title with its play CTA and the loop', () => {
    renderPage(<ArcadePage />)
    // TEMP (single-title focus): the featured hero stands in for the gallery —
    // assert the lanes again when they come back.
    expect(screen.getByText('Tobu Tobu Girl')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Play Tobu Tobu Girl' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/how the loop works/i)).toBeInTheDocument()
    expect(screen.getByText('gambatte')).toBeInTheDocument() // about-this-ROM facts
  })
  it('credits lists bundled games', () => {
    renderPage(<CreditsPage />)
    expect(screen.getByText('Licenses & credits')).toBeInTheDocument()
    expect(screen.getByText('2048')).toBeInTheDocument()
  })
  it('achievements', async () => {
    renderPage(<AchievementsPage />)
    expect(await screen.findByText('Week Warrior')).toBeInTheDocument()
  })
  it('settings shows billing', () => {
    renderPage(<SettingsPage />)
    expect(screen.getByText(/billing/i)).toBeInTheDocument()
  })
  it('admin lists users', async () => {
    renderPage(<AdminUsersPage />)
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
  })
})
