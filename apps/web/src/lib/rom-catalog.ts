import type { RomSystem } from '@/core/roms'

// A curated, legally-distributable homebrew title. Binaries are NOT shipped in
// the repo — drop the file into `public/roms/<fileName>` (see the README there).
// Metadata stands alone so the gallery looks alive before the files land.
export type RomEntry = {
  source: 'catalog'
  id: string
  title: string
  system: RomSystem
  author: string
  license: string
  description: string
  fileName: string
  // Tailwind text-color class for the tile's accent (no box art yet).
  accent: string
}

// A ROM the user supplied from their own device. The bytes live in `file` and
// go straight to the emulator; we never persist or execute them ourselves.
export type UploadedRom = {
  source: 'upload'
  id: string
  title: string
  system: RomSystem
  file: File
}

export type PlayableRom = RomEntry | UploadedRom

export const ROM_CATALOG: RomEntry[] = [
  {
    source: 'catalog',
    id: 'alter-ego',
    title: 'Alter Ego',
    system: 'nes',
    author: 'RetroSouls',
    license: 'Freeware',
    description:
      'A clever puzzle-platformer where every move you make is mirrored by your shadow self.',
    fileName: 'alter-ego.nes',
    accent: 'text-rose-400',
  },
  {
    source: 'catalog',
    id: 'lan-master',
    title: 'Lan Master',
    system: 'nes',
    author: 'Shiru',
    license: 'Freeware',
    description:
      'Rotate the pipes to connect every node on the network before the clock runs out.',
    fileName: 'lan-master.nes',
    accent: 'text-amber-400',
  },
  {
    source: 'catalog',
    id: 'tobu-tobu-girl',
    title: 'Tobu Tobu Girl',
    system: 'gb',
    author: 'Tangram Games',
    license: 'Open source',
    description:
      'A vertical arcade climber — bounce off enemies to chase your runaway pet across the sky.',
    fileName: 'tobu-tobu-girl.gb',
    accent: 'text-sky-400',
  },
  {
    source: 'catalog',
    id: 'ucity',
    title: 'µCity',
    system: 'gbc',
    author: 'AntonioND',
    license: 'GPLv3',
    description:
      'An open-source city-building sim in the spirit of the classics, on Game Boy Color.',
    fileName: 'ucity.gbc',
    accent: 'text-emerald-400',
  },
  {
    source: 'catalog',
    id: 'anguna',
    title: 'Anguna',
    system: 'gba',
    author: 'Nathan Tolbert',
    license: 'Freeware',
    description:
      'A compact action-RPG dungeon crawl built for the Game Boy Advance homebrew scene.',
    fileName: 'anguna.gba',
    accent: 'text-violet-400',
  },
]

const SEPARATORS = /[._\-+]+/g

// "tobu-tobu-girl.gb" -> "Tobu Tobu Girl"
export function prettyTitle(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return (
    base
      .replace(SEPARATORS, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || fileName
  )
}

// Deterministic id (no Math.random/Date) so the same file always maps to the
// same gallery entry.
export function uploadedRomFromFile(file: File, system: RomSystem): UploadedRom {
  return {
    source: 'upload',
    id: `upload:${file.name}:${file.size}`,
    title: prettyTitle(file.name),
    system,
    file,
  }
}

// URL of a catalog ROM's binary, served from `public/roms/`.
export function romAssetUrl(entry: RomEntry): string {
  return `${import.meta.env.BASE_URL}roms/${entry.fileName}`
}

// Thrown when a catalog ROM's binary hasn't been dropped into `public/roms/`
// yet — distinct from an emulator failure so the UI can tell the user which.
export class RomNotFoundError extends Error {
  readonly fileName: string
  constructor(fileName: string) {
    super(`ROM file not found: ${fileName}`)
    this.name = 'RomNotFoundError'
    this.fileName = fileName
  }
}

// Resolves a playable ROM to its bytes. Uploads already hold the file; catalog
// entries are fetched from `public/roms/` (a 404 means "not installed yet").
export async function loadRomFile(rom: PlayableRom): Promise<File> {
  if (rom.source === 'upload') return rom.file
  const response = await fetch(romAssetUrl(rom))
  if (!response.ok) throw new RomNotFoundError(rom.fileName)
  const blob = await response.blob()
  return new File([blob], rom.fileName)
}
