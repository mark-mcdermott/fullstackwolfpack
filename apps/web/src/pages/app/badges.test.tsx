import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api-client', () => ({
  api: {
    data: {
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
        inProgress: [
          {
            slug: 'legend',
            name: 'Legend',
            description: 'Reach level 20',
            current: 3,
            target: 20,
            earnedAt: null,
          },
        ],
        locked: [
          {
            slug: 'master-wolf',
            name: 'Master Wolf',
            description: 'Earn all achievements',
            current: 0,
            target: 1,
            earnedAt: null,
          },
        ],
      }),
    },
  },
}))

import { BadgesPage } from '@/pages/app/badges'

function renderBadges() {
  render(
    <MemoryRouter>
      <BadgesPage />
    </MemoryRouter>,
  )
}

describe('BadgesPage', () => {
  it('surfaces earned, in-progress AND locked badges', async () => {
    renderBadges()
    expect(await screen.findByText('Week Warrior')).toBeInTheDocument()
    expect(screen.getByText('Legend')).toBeInTheDocument()
    // Locked badges are now shown too (the page used to render only
    // earned + in-progress, so it was always empty in practice).
    expect(screen.getByText('Master Wolf')).toBeInTheDocument()
  })

  it('shows current/target progress for unearned badges', async () => {
    renderBadges()
    expect(await screen.findByText('3 / 20')).toBeInTheDocument()
  })
})
