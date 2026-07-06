import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import type { PublicUser } from '@/core/schemas'

// A deferred enroll so generation stays "in flight" while we assert the UI.
const hoisted = vi.hoisted(() => {
  const deferred: { resolve?: (v: unknown) => void } = {}
  return {
    deferred,
    enroll: () =>
      new Promise((res) => {
        deferred.resolve = res
      }),
    generationEta: async () => ({ etaMs: 10000, samples: 2 }),
    course: async () => ({
      courseId: 'course-1',
      topic: 'React',
      lessons: [],
      nextLessonId: 'lesson-1',
    }),
  }
})

vi.mock('@/api-client', () => ({
  api: {
    data: {
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
      course: hoisted.course,
    },
    courses: {
      enroll: hoisted.enroll,
      generationEta: hoisted.generationEta,
    },
    preferences: {
      get: async () => ({
        askSkillLevel: false,
        askCoverage: false,
        linkifyTerms: false,
      }),
    },
  },
}))

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

describe('Generate-course progress bar', () => {
  it('replaces the start-learning CTA with a progress bar while generating', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <TopicsPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    // An un-generated topic's primary CTA generates a course on click.
    const btn = await screen.findByRole('button', { name: /start learning/i })
    await userEvent.click(btn)

    // Enroll is still pending → the button is swapped for a progressbar.
    const bar = await screen.findByRole('progressbar', {
      name: /generating course/i,
    })
    expect(bar).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /start learning/i }),
    ).not.toBeInTheDocument()
  })
})
