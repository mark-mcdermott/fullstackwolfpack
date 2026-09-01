import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api-client', () => ({
  api: {
    public: {
      reviewQuestions: vi.fn(),
      // Never settles, so anything on screen after a click was produced locally.
      grade: vi.fn(() => new Promise(() => {})),
    },
  },
}))

import { api } from '@/api-client'
import { AuthContext, type AuthContextValue } from '@/hooks/auth-context'
import { clearGuestReviews, seedGuestReviewCard } from '@/lib/guest-review'
import { ReviewPage } from './review'

// Driven through the guest path, which skips the Pro gate and keeps its schedule in
// localStorage — so this exercises the real wiring end to end: the queue carrying the
// key and the card, and the page grading from them.

const auth = { user: null, loading: false } as unknown as AuthContextValue

const question = {
  id: 'q1',
  prompt: 'What does await do?',
  options: ['nothing', 'unwraps a promise'],
  correctIndex: 1,
  explanation: 'It suspends until the promise settles.',
}

const reviewQuestions = vi.mocked(api.public.reviewQuestions)

function renderQueue() {
  return render(
    <AuthContext.Provider value={auth}>
      <ReviewPage guest />
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  clearGuestReviews()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // Seed, then jump past the interval the scheduler set, so the card is actually due.
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  seedGuestReviewCard('q1', true)
  vi.setSystemTime(new Date('2026-01-05T00:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ReviewPage — instant grading', () => {
  it('paints the verdict and the next due date without the network', async () => {
    reviewQuestions.mockResolvedValue([question])
    renderQueue()

    fireEvent.click(await screen.findByRole('button', { name: /unwraps a promise/ }))

    expect(screen.getByText('Correct')).toBeInTheDocument()
    expect(screen.getByText(/next review/)).toBeInTheDocument()
    expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
  })

  it('still records the grade, which is what reschedules the card', async () => {
    reviewQuestions.mockResolvedValue([question])
    renderQueue()

    fireEvent.click(await screen.findByRole('button', { name: /unwraps a promise/ }))
    expect(api.public.grade).toHaveBeenCalledWith('q1', { selectedIndex: 1 })
  })

  it('marks a wrong pick without waiting', async () => {
    reviewQuestions.mockResolvedValue([question])
    renderQueue()

    fireEvent.click(await screen.findByRole('button', { name: /nothing/ }))
    expect(screen.getByText('Not quite')).toBeInTheDocument()
  })

  // A queue served without the key has to fall back rather than paint a guess.
  it('waits for the server when the card arrives with no key', async () => {
    reviewQuestions.mockResolvedValue([{ ...question, correctIndex: null }])
    renderQueue()

    fireEvent.click(await screen.findByRole('button', { name: /unwraps a promise/ }))

    expect(screen.getByText('Checking…')).toBeInTheDocument()
    expect(screen.queryByText('Correct')).not.toBeInTheDocument()
  })
})
