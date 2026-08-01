import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { LearnBrowse } from './learn-browse'

const LESSONS = [
  {
    lessonId: 'l1',
    title: 'Scope & Closures',
    orderIndex: 0,
    estMinutes: 22,
    status: 'not_started',
  },
  {
    lessonId: 'l2',
    title: 'Promises',
    orderIndex: 1,
    estMinutes: 20,
    status: 'not_started',
  },
]

vi.mock('@/api-client', () => ({
  api: {
    public: {
      topics: async () => ({
        topics: [
          {
            slug: 'javascript',
            name: 'JavaScript',
            description: 'The language of the web.',
          },
        ],
      }),
      course: async () => ({
        courseId: 'builtin-javascript',
        topicSlug: 'javascript',
        status: 'ready',
        lessons: LESSONS,
        nextLessonId: 'l1',
      }),
    },
  },
}))

const guest = {
  user: null,
  loading: false,
} as unknown as AuthContextValue

function renderPage() {
  render(
    <AuthContext.Provider value={guest}>
      <MemoryRouter>
        <LearnBrowse />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('LearnBrowse', () => {
  beforeEach(() => localStorage.clear())

  it('features the built-in course with its real length and outline', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'JavaScript' }),
    ).toBeInTheDocument()
    // Course facts come from the outline, not hardcoded copy.
    expect(
      screen.getByText(/2 lessons · 42m total · \+50 XP per lesson/i),
    ).toBeInTheDocument()
    for (const lesson of LESSONS) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument()
    }
  })

  it('points the CTA at the first unfinished lesson', async () => {
    renderPage()

    const cta = await screen.findByRole('link', {
      name: /start: scope & closures/i,
    })
    expect(cta).toHaveAttribute('href', '/learn/l1')
  })

  it('continues from the guest’s saved progress', async () => {
    localStorage.setItem(
      'fw-guest-progress',
      JSON.stringify({ completed: { l1: { score: 100, xp: 75 } }, xp: 75 }),
    )
    renderPage()

    const cta = await screen.findByRole('link', { name: /continue: promises/i })
    expect(cta).toHaveAttribute('href', '/learn/l2')
    expect(screen.getByText('75')).toBeInTheDocument() // XP banked as a guest
    expect(screen.getByText('1 / 2')).toBeInTheDocument() // lessons done
  })
})
