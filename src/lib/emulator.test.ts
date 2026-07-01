import { beforeEach, describe, expect, it, vi } from 'vitest'

const launch = vi.fn()
const pause = vi.fn()
const resume = vi.fn()
const exit = vi.fn()

vi.mock('nostalgist', () => ({
  Nostalgist: { launch: (opts: unknown) => launch(opts) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  launch.mockResolvedValue({ pause, resume, exit })
})

describe('launchRom adapter', () => {
  it('passes a URL rom straight through and maps session methods', async () => {
    const { launchRom } = await import('./emulator')
    const canvas = document.createElement('canvas')

    const session = await launchRom({
      core: 'fceumm',
      rom: '/roms/alter-ego.nes',
      canvas,
    })

    expect(launch).toHaveBeenCalledWith({
      core: 'fceumm',
      rom: '/roms/alter-ego.nes',
      element: canvas,
    })

    session.pause()
    session.resume()
    session.stop()
    expect(pause).toHaveBeenCalledOnce()
    expect(resume).toHaveBeenCalledOnce()
    expect(exit).toHaveBeenCalledOnce()
  })

  it('wraps an uploaded File as { fileName, fileContent }', async () => {
    const { launchRom } = await import('./emulator')
    const canvas = document.createElement('canvas')
    const file = new File([new Uint8Array([1, 2, 3])], 'mygame.gba')

    await launchRom({ core: 'mgba', rom: file, canvas })

    expect(launch).toHaveBeenCalledWith({
      core: 'mgba',
      rom: { fileName: 'mygame.gba', fileContent: file },
      element: canvas,
    })
  })
})
