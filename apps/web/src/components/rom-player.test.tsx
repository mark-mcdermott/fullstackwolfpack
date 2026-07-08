import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EmulatorSession, LaunchOptions } from '@/lib/emulator'
import type { RomEntry, UploadedRom } from '@/lib/rom-catalog'
import { RomPlayer } from './rom-player'

// The player mounts usePlaytimeTracker, which reads useAuth. Provide a signed-in
// user so the tracker behaves as it does for logged-in players (guests are
// covered by the /play route + hook guards).
vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

// No active focus session by default, so the in-game lesson overlay stays closed.
vi.mock('@/hooks/timer-context', () => ({
  useTimer: () => ({ active: false, step: null, skip: () => {} }),
}))

const catalogRom: RomEntry = {
  source: 'catalog',
  id: 'brick-buster',
  title: 'Brick Buster',
  system: 'nes',
  author: 'sebastiandine',
  license: 'zlib',
  description: 'Brick breaker.',
  fileName: 'brick-buster.nes',
  accent: 'text-amber-400',
}

const uploadRom: UploadedRom = {
  source: 'upload',
  id: 'upload:mine.gba:2',
  title: 'Mine',
  system: 'gba',
  file: new File([new Uint8Array([1, 2])], 'mine.gba'),
}

function fakeSession(): EmulatorSession {
  return {
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    pressDown: vi.fn(),
    pressUp: vi.fn(),
  }
}

function stubOkFetch() {
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])])
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      headers: new Headers({ 'content-type': 'application/octet-stream' }),
      blob: async () => blob,
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

function setup(
  rom: RomEntry | UploadedRom = uploadRom,
  launcherImpl?: (opts: LaunchOptions) => Promise<EmulatorSession>,
) {
  const session = fakeSession()
  const launcher = vi.fn(launcherImpl ?? (async (_opts: LaunchOptions) => session))
  const onExit = vi.fn()
  const view = render(
    <MemoryRouter>
      <RomPlayer rom={rom} onExit={onExit} launcher={launcher} />
    </MemoryRouter>,
  )
  return { session, launcher, onExit, ...view }
}

describe('RomPlayer', () => {
  it('launches an uploaded ROM with the right core and the File itself', async () => {
    const { launcher } = setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })

    const opts = launcher.mock.calls[0][0]
    expect(opts.core).toBe('mgba')
    expect(opts.rom).toBe(uploadRom.file)
    expect(opts.canvas).toBeInstanceOf(HTMLCanvasElement)
  })

  it('applies the saved key/gamepad bindings via retroarchConfig', async () => {
    const { launcher } = setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })

    const config = launcher.mock.calls[0][0].retroarchConfig
    expect(config?.input_player1_a).toBe('x') // default keyboard A = X
    expect(config?.input_player1_a_btn).toBe('1') // default pad A = button 1
  })

  it('toggles a read-only controls reference from the toolbar', async () => {
    const user = userEvent.setup()
    setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })

    expect(
      screen.queryByRole('button', { name: 'Close controls' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Controls' }))
    expect(
      screen.getByRole('link', { name: /settings/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close controls' }))
    expect(
      screen.queryByRole('button', { name: 'Close controls' }),
    ).not.toBeInTheDocument()
  })

  it('runs on a canvas attached inside the player, and removes it on unmount', async () => {
    const { launcher, unmount } = setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })

    const canvas = launcher.mock.calls[0][0].canvas
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    // Attached to the player's container — never a detached node Nostalgist
    // would re-append to <body> (the "game below the footer" bug).
    expect(canvas.isConnected).toBe(true)
    expect(canvas.parentElement).not.toBe(document.body)

    unmount()
    expect(canvas.isConnected).toBe(false)
  })

  it('fetches a catalog ROM and launches it as a named File', async () => {
    stubOkFetch()
    const { launcher } = setup(catalogRom)
    await screen.findByRole('button', { name: 'Pause' })

    expect(fetch).toHaveBeenCalledWith('/roms/brick-buster.nes')
    const opts = launcher.mock.calls[0][0]
    expect(opts.core).toBe('fceumm')
    expect(opts.rom).toBeInstanceOf(File)
    expect(opts.rom.name).toBe('brick-buster.nes')
  })

  it('toggles pause/resume on the session', async () => {
    const user = userEvent.setup()
    const { session } = setup(uploadRom)

    await user.click(await screen.findByRole('button', { name: 'Pause' }))
    expect(session.pause).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Resume' }))
    expect(session.resume).toHaveBeenCalledOnce()
  })

  it('shows no lesson overlay or Learn-now button outside a focus session', async () => {
    setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })
    // The in-game lesson only appears during a session's learn phase (mocked
    // inactive here), so casual ROM play is uninterrupted.
    expect(
      screen.queryByRole('button', { name: /learn now/i }),
    ).not.toBeInTheDocument()
  })

  it('exits on click and stops the session on unmount', async () => {
    const user = userEvent.setup()
    const { session, onExit, unmount } = setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })

    await user.click(screen.getByRole('button', { name: 'Exit' }))
    expect(onExit).toHaveBeenCalledOnce()

    unmount()
    expect(session.stop).toHaveBeenCalledOnce()
  })

  it('shows an install hint when a catalog ROM is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    )
    render(<RomPlayer rom={catalogRom} onExit={vi.fn()} launcher={vi.fn()} />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/not installed/i)
    expect(alert).toHaveTextContent(/brick-buster\.nes/i)
    expect(alert).toHaveTextContent(/public\/roms/i)
  })

  it('shows a generic error (not the install hint) when the emulator fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const launcher = vi.fn(async () => {
      throw new Error('boom')
    })
    // Uploaded ROM: no fetch, so failure comes from the emulator itself.
    render(<RomPlayer rom={uploadRom} onExit={vi.fn()} launcher={launcher} />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/couldn.t start/i)
    expect(alert).not.toHaveTextContent(/public\/roms/i)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
