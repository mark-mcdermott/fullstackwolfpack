import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LeaderboardView } from '@/core/leaderboard'
import { LeaderboardPage } from './leaderboard'

const optedOut: LeaderboardView = {
  optedIn: false,
  me: null,
  entries: [
    { rank: 1, name: 'Ada', level: 9, xp: 5000, streak: 12, isMe: false },
    { rank: 2, name: 'Bo', level: 7, xp: 3200, streak: 0, isMe: false },
  ],
}

const optedIn: LeaderboardView = {
  optedIn: true,
  me: { rank: 3, name: 'Me', level: 2, xp: 400, streak: 1, isMe: true },
  entries: [
    ...optedOut.entries,
    { rank: 3, name: 'Me', level: 2, xp: 400, streak: 1, isMe: true },
  ],
}

const get = vi.fn()
const setOptIn = vi.fn()
vi.mock('@/api-client', () => ({
  api: {
    leaderboard: {
      get: () => get(),
      setOptIn: (optIn: boolean) => setOptIn(optIn),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  get.mockResolvedValue(optedOut)
  setOptIn.mockResolvedValue(optedIn)
})

describe('LeaderboardPage', () => {
  it('renders the ranking with a Join CTA when opted out', async () => {
    render(<LeaderboardPage />)
    expect(await screen.findByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Bo')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /join leaderboard/i }),
    ).toBeInTheDocument()
  })

  it('joins the board and surfaces the highlighted "You" row', async () => {
    render(<LeaderboardPage />)
    await screen.findByText('Ada')

    await userEvent.click(
      screen.getByRole('button', { name: /join leaderboard/i }),
    )
    expect(setOptIn).toHaveBeenCalledWith(true)

    expect(
      await screen.findByRole('button', { name: /leave leaderboard/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })
})
