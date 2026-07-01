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
  it('hands Nostalgist the file content (not a path) and maps session methods', async () => {
    const { launchRom } = await import('./emulator')
    const canvas = document.createElement('canvas')
    const file = new File([new Uint8Array([1, 2, 3])], 'alter-ego.nes')

    const session = await launchRom({ core: 'fceumm', rom: file, canvas })

    expect(launch).toHaveBeenCalledWith({
      core: 'fceumm',
      rom: { fileName: 'alter-ego.nes', fileContent: file },
      element: canvas,
    })

    session.pause()
    session.resume()
    session.stop()
    expect(pause).toHaveBeenCalledOnce()
    expect(resume).toHaveBeenCalledOnce()
    expect(exit).toHaveBeenCalledOnce()
  })

  it('omits retroarchConfig when not provided', async () => {
    const { launchRom } = await import('./emulator')
    const file = new File([new Uint8Array([1])], 'x.nes')
    await launchRom({ core: 'fceumm', rom: file, canvas: document.createElement('canvas') })
    expect(launch.mock.calls[0][0]).not.toHaveProperty('retroarchConfig')
  })

  it('forwards retroarchConfig overrides for input remapping', async () => {
    const { launchRom } = await import('./emulator')
    const file = new File([new Uint8Array([1])], 'x.nes')
    const retroarchConfig = { input_player1_a: 'l', input_player1_a_btn: '3' }
    await launchRom({
      core: 'fceumm',
      rom: file,
      canvas: document.createElement('canvas'),
      retroarchConfig,
    })
    expect(launch.mock.calls[0][0].retroarchConfig).toEqual(retroarchConfig)
  })
})
