import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { LessonView } from '@/core/lesson-view'
import { LearnPage } from './learn'

// A minimal lesson whose title identifies which id was fetched, so we can prove
// the player actually swaps lessons when the route param changes.
function lessonFixture(id: string): LessonView {
  return {
    lessonId: id,
    courseId: 'course-1',
    topic: 'Git',
    topicSlug: 'git',
    title: `Lesson ${id.toUpperCase()}`,
    estMinutes: 5,
    glossary: [],
    segments: [
      {
        id: `${id}-s1`,
        type: 'reading',
        title: 'Intro',
        markdown: 'Body copy.',
        estMinutes: 5,
        questions: [],
        exercise: null,
      },
    ],
  }
}

vi.mock('@/api-client', () => ({
  api: {
    data: { lesson: async (id: string) => lessonFixture(id) },
    preferences: {
      get: async () => ({
        askSkillLevel: false,
        askCoverage: false,
        linkifyTerms: false,
      }),
    },
  },
}))

vi.mock('@/hooks/auth-context', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('@/components/learn/tutor-panel', () => ({ TutorPanel: () => null }))

describe('LearnPage navigation', () => {
  it('swaps the lesson when the route id changes (Continue course)', async () => {
    const router = createMemoryRouter(
      [{ path: '/app/learn/:lessonId', element: <LearnPage /> }],
      { initialEntries: ['/app/learn/a'] },
    )
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Lesson A')).toBeInTheDocument()

    // Navigating to a different lesson id must refetch + reset — not leave the
    // previous lesson (the "Continue course does nothing" bug).
    await act(async () => {
      await router.navigate('/app/learn/b')
    })

    expect(await screen.findByText('Lesson B')).toBeInTheDocument()
    expect(screen.queryByText('Lesson A')).not.toBeInTheDocument()
  })
})
