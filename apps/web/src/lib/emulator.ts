// The only place that touches Nostalgist. Everything else depends on the small
// `EmulatorSession` interface below, so the WASM core never reaches a test and
// the player can be driven with a fake `Launcher`.

export interface EmulatorSession {
  pause(): void
  resume(): void
  stop(): void
  // Programmatic RetroPad input for the on-screen touch gamepad. `button` is a
  // RetroPad name ('up', 'a', 'start', …) — the RETROPAD_BUTTONS set.
  pressDown(button: string): void
  pressUp(button: string): void
}

export interface LaunchOptions {
  core: string
  // The ROM bytes. We always hand Nostalgist the file content directly —
  // passing a bare path lets Nostalgist "resolve" it against its default ROM
  // CDN instead of our own assets.
  rom: File
  canvas: HTMLCanvasElement
  // RetroArch overrides (input_player1_* remaps); merged over Nostalgist's
  // defaults, so we only pass what the user changed.
  retroarchConfig?: Record<string, string>
}

export type Launcher = (options: LaunchOptions) => Promise<EmulatorSession>

export const launchRom: Launcher = async ({
  core,
  rom,
  canvas,
  retroarchConfig,
}) => {
  const { Nostalgist } = await import('nostalgist')
  const nostalgist = await Nostalgist.launch({
    core,
    rom: { fileName: rom.name, fileContent: rom },
    element: canvas,
    ...(retroarchConfig ? { retroarchConfig } : {}),
  })
  return {
    pause: () => nostalgist.pause(),
    resume: () => nostalgist.resume(),
    stop: () => nostalgist.exit(),
    pressDown: (button) => nostalgist.pressDown(button),
    pressUp: (button) => nostalgist.pressUp(button),
  }
}
