// The only place that touches Nostalgist. Everything else depends on the small
// `EmulatorSession` interface below, so the WASM core never reaches a test and
// the player can be driven with a fake `Launcher`.

export interface EmulatorSession {
  pause(): void
  resume(): void
  stop(): void
}

export interface LaunchOptions {
  core: string
  // A URL string (catalog ROM) or a File the user uploaded.
  rom: string | File
  canvas: HTMLCanvasElement
}

export type Launcher = (options: LaunchOptions) => Promise<EmulatorSession>

export const launchRom: Launcher = async ({ core, rom, canvas }) => {
  const { Nostalgist } = await import('nostalgist')
  const nostalgist = await Nostalgist.launch({
    core,
    rom: typeof rom === 'string' ? rom : { fileName: rom.name, fileContent: rom },
    element: canvas,
  })
  return {
    pause: () => nostalgist.pause(),
    resume: () => nostalgist.resume(),
    stop: () => nostalgist.exit(),
  }
}
