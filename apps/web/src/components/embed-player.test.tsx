import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { EmbedPlayer } from './embed-player'

// The player mounts usePlaytimeTracker, which reads useAuth. Provide a signed-in
// user so the tracker behaves as it does for logged-in players (guests are
// covered by the /play route + hook guards).
vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

const game = EMBED_CATALOG[0]

describe('EmbedPlayer', () => {
  it('renders the game in a sandboxed iframe with attribution', () => {
    render(<EmbedPlayer game={game} onExit={vi.fn()} />)

    const frame = screen.getByTitle(game.title)
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', expect.stringContaining(`games/${game.slug}/`))
    // Sandboxed, and NOT allowing forms/popups/top-navigation.
    const sandbox = frame.getAttribute('sandbox') ?? ''
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-top-navigation')
    expect(sandbox).not.toContain('allow-popups')

    // Attribution (author + license source link) is shown at play time.
    expect(screen.getByText(game.author, { exact: false })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: game.license }),
    ).toHaveAttribute('href', game.sourceUrl)
  })

  it('exits back to the gallery', async () => {
    const onExit = vi.fn()
    render(<EmbedPlayer game={game} onExit={onExit} />)
    await userEvent.click(screen.getByRole('button', { name: /exit/i }))
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('overlays the lesson prompt on Pause for lesson, and resumes', async () => {
    render(<EmbedPlayer game={game} onExit={vi.fn()} />)
    await userEvent.click(
      screen.getByRole('button', { name: /pause for lesson/i }),
    )
    expect(screen.getByText(/time to learn/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /resume game/i }))
    expect(screen.queryByText(/time to learn/i)).not.toBeInTheDocument()
  })

  it('requests fullscreen from the toolbar when the API is available', async () => {
    // jsdom has no Fullscreen API — stub just enough for the hook to light up.
    const requestFullscreen = vi.fn(() => Promise.resolve())
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    try {
      render(<EmbedPlayer game={game} onExit={vi.fn()} />)
      await userEvent.click(screen.getByRole('button', { name: /^fullscreen$/i }))
      expect(requestFullscreen).toHaveBeenCalledTimes(1)
    } finally {
      delete (document as { fullscreenEnabled?: boolean }).fullscreenEnabled
      delete (HTMLElement.prototype as { requestFullscreen?: unknown })
        .requestFullscreen
    }
  })
})
