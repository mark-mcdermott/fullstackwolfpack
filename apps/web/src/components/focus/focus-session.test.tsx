import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ record: vi.fn(async () => {}) }))
vi.mock('@/api-client', () => ({ api: { focus: { record: h.record } } }))

import { FocusSession } from './focus-session'

describe('FocusSession', () => {
  it('offers a config + start button while idle', () => {
    render(<FocusSession />)
    expect(
      screen.getByRole('button', { name: /start session/i }),
    ).toBeInTheDocument()
    // Default plan: 1 round, 25m play + 5m learn = 30m total.
    expect(screen.getByText(/1 round/i)).toBeInTheDocument()
    expect(screen.getByText(/30m total/i)).toBeInTheDocument()
  })

  it('runs the play/learn cycles to completion and records the session', async () => {
    render(<FocusSession />)
    await userEvent.click(
      screen.getByRole('button', { name: /start session/i }),
    )

    // Running: pause + end controls are shown.
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /end/i })).toBeInTheDocument()

    // One round = play then learn → two skips finish the session.
    await userEvent.click(screen.getByRole('button', { name: /skip/i }))
    await userEvent.click(screen.getByRole('button', { name: /skip/i }))

    expect(await screen.findByText(/session complete/i)).toBeInTheDocument()
    expect(h.record).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('button', { name: /new session/i }),
    ).toBeInTheDocument()
  })
})
