import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EmulatorSession, LaunchOptions } from '@/lib/emulator'
import type { RomEntry, UploadedRom } from '@/lib/rom-catalog'
import { RomPlayer } from './rom-player'

const catalogRom: RomEntry = {
  source: 'catalog',
  id: 'alter-ego',
  title: 'Alter Ego',
  system: 'nes',
  author: 'RetroSouls',
  license: 'Freeware',
  description: 'Puzzle platformer.',
  fileName: 'alter-ego.nes',
  accent: 'text-rose-400',
}

const uploadRom: UploadedRom = {
  source: 'upload',
  id: 'upload:mine.gba:2',
  title: 'Mine',
  system: 'gba',
  file: new File([new Uint8Array([1, 2])], 'mine.gba'),
}

function fakeSession(): EmulatorSession {
  return { pause: vi.fn(), resume: vi.fn(), stop: vi.fn() }
}

function stubOkFetch() {
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])])
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, blob: async () => blob })),
  )
}

afterEach(() => vi.unstubAllGlobals())

function setup(
  rom: RomEntry | UploadedRom = uploadRom,
  launcherImpl?: (opts: LaunchOptions) => Promise<EmulatorSession>,
) {
  const session = fakeSession()
  const launcher = vi.fn(launcherImpl ?? (async (_opts: LaunchOptions) => session))
  const onExit = vi.fn()
  const view = render(<RomPlayer rom={rom} onExit={onExit} launcher={launcher} />)
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

  it('fetches a catalog ROM and launches it as a named File', async () => {
    stubOkFetch()
    const { launcher } = setup(catalogRom)
    await screen.findByRole('button', { name: 'Pause' })

    expect(fetch).toHaveBeenCalledWith('/roms/alter-ego.nes')
    const opts = launcher.mock.calls[0][0]
    expect(opts.core).toBe('fceumm')
    expect(opts.rom).toBeInstanceOf(File)
    expect(opts.rom.name).toBe('alter-ego.nes')
  })

  it('toggles pause/resume on the session', async () => {
    const user = userEvent.setup()
    const { session } = setup(uploadRom)

    await user.click(await screen.findByRole('button', { name: 'Pause' }))
    expect(session.pause).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Resume' }))
    expect(session.resume).toHaveBeenCalledOnce()
  })

  it('pauses for a lesson and resumes from the overlay', async () => {
    const user = userEvent.setup()
    const { session } = setup(uploadRom)
    await screen.findByRole('button', { name: 'Pause' })

    await user.click(screen.getByRole('button', { name: 'Pause for lesson' }))
    expect(session.pause).toHaveBeenCalledOnce()
    expect(screen.getByText('Time to learn')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resume game' }))
    expect(session.resume).toHaveBeenCalledOnce()
    expect(screen.queryByText('Time to learn')).not.toBeInTheDocument()
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
    expect(alert).toHaveTextContent(/alter-ego\.nes/i)
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
