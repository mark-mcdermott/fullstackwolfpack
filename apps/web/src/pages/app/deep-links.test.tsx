import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import type { PublicUser } from '@/core/schemas'

const topic = {
  slug: 'react',
  name: 'React',
  category: 'frontend',
  difficulty: 'beginner',
  pct: 40,
  lessonsCompleted: 2,
  lessonsTotal: 5,
}

vi.mock('@/api-client', () => ({
  api: {
    data: {
      dashboard: async () => ({
        user: { displayName: 'Mark', level: 1, xp: 0, xpToNext: 400, levelPct: 0 },
        stats: {
          streak: 3,
          bestStreak: 5,
          accuracy: 90,
          hoursLearned: 4,
          hoursPlayed: 1,
          lessonsCompleted: 2,
          sessions: 3,
          totalXp: 200,
        },
        focus: [topic],
        recentLessons: [],
        weekActivity: [],
      }),
      progress: async () => ({
        stats: {
          streak: 3,
          bestStreak: 5,
          hoursLearned: 4,
          lessonsCompleted: 2,
          totalXp: 200,
        },
        topics: [topic],
        skills: [],
        activity: [],
      }),
      series: async () => ({ xpCumulative: [] }),
      topics: async () => [topic],
    },
  },
}))

import { DashboardPage } from '@/pages/app/dashboard'
import { ProgressPage } from '@/pages/app/progress'
import { TopicsPage } from '@/pages/app/topics'

const user: PublicUser = {
  id: 'u1',
  email: 'mark@x.com',
  displayName: 'Mark',
  totpEnabled: false,
  role: 'user',
  tier: 'free',
}

const auth: AuthContextValue = {
  user,
  loading: false,
  register: async () => {},
  login: async () => {},
  recover: async () => {},
  logout: async () => {},
  refresh: async () => {},
}

function renderPage(ui: ReactNode, path = '/') {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('topic-name deep links', () => {
  it('links the Progress topic name to its Topics card', async () => {
    renderPage(<ProgressPage />)
    const link = await screen.findByRole('link', { name: 'React' })
    expect(link).toHaveAttribute('href', '/app/topics?topic=react')
  })

  it('links the Dashboard current-focus name to its Topics card', async () => {
    renderPage(<DashboardPage />)
    const link = await screen.findByRole('link', { name: 'React' })
    expect(link).toHaveAttribute('href', '/app/topics?topic=react')
  })

  it('highlights the deep-linked card on the Topics page', async () => {
    const { container } = renderPage(<TopicsPage />, '/app/topics?topic=react')
    await screen.findByText('React')
    const card = container.querySelector('#topic-react')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('ring-primary')
  })

  it('does not highlight cards without a matching deep link', async () => {
    const { container } = renderPage(<TopicsPage />, '/app/topics')
    await screen.findByText('React')
    expect(container.querySelector('#topic-react')).not.toHaveClass(
      'ring-primary',
    )
  })
})
