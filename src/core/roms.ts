// Pure ROM domain — no DOM, no Node. Shared by the gallery, the upload
// validator and the emulator adapter so every surface agrees on which systems
// exist, which libretro core runs each, and which files we accept.

export const ROM_SYSTEMS = [
  'nes',
  'gb',
  'gbc',
  'gba',
  'genesis',
  'snes',
] as const

export type RomSystem = (typeof ROM_SYSTEMS)[number]

type SystemMeta = {
  label: string
  // libretro core Nostalgist loads for this system.
  core: string
  // Accepted file extensions, dot-prefixed and lowercase.
  extensions: string[]
}

export const SYSTEM_META: Record<RomSystem, SystemMeta> = {
  nes: { label: 'NES', core: 'fceumm', extensions: ['.nes'] },
  gb: { label: 'Game Boy', core: 'gambatte', extensions: ['.gb'] },
  gbc: { label: 'Game Boy Color', core: 'gambatte', extensions: ['.gbc'] },
  gba: { label: 'Game Boy Advance', core: 'mgba', extensions: ['.gba'] },
  genesis: {
    label: 'Genesis',
    core: 'genesis_plus_gx',
    extensions: ['.md', '.gen', '.smd'],
  },
  snes: { label: 'SNES', core: 'snes9x', extensions: ['.sfc', '.smc'] },
}

// Cart sizes top out at 32 MB (large GBA carts); anything bigger isn't a ROM
// we support and shouldn't be loaded into memory.
export const MAX_ROM_BYTES = 32 * 1024 * 1024

export const ACCEPTED_EXTENSIONS: string[] = ROM_SYSTEMS.flatMap(
  (system) => SYSTEM_META[system].extensions,
)

export function coreForSystem(system: RomSystem): string {
  return SYSTEM_META[system].core
}

function extensionOf(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) return null
  return fileName.slice(dot).toLowerCase()
}

export function systemForExtension(fileName: string): RomSystem | null {
  const ext = extensionOf(fileName)
  if (!ext) return null
  return (
    ROM_SYSTEMS.find((system) => SYSTEM_META[system].extensions.includes(ext)) ??
    null
  )
}

export type RomValidation =
  | { ok: true; system: RomSystem }
  | { ok: false; error: string }

// Validates an untrusted upload by name + size only — the bytes are handed
// straight to the emulator, never executed by us.
export function validateRom(file: { name: string; size: number }): RomValidation {
  const system = systemForExtension(file.name)
  if (!system) {
    return {
      ok: false,
      error: `Unsupported file type. Supported: ${ACCEPTED_EXTENSIONS.join(', ')}`,
    }
  }
  if (file.size <= 0) {
    return { ok: false, error: 'That file is empty.' }
  }
  if (file.size > MAX_ROM_BYTES) {
    const maxMb = Math.round(MAX_ROM_BYTES / (1024 * 1024))
    return { ok: false, error: `ROM is too large (max ${maxMb} MB).` }
  }
  return { ok: true, system }
}
