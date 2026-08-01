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
  // Tailwind text-color class for the tile's accent.
  accent: string
  // Optional cover art (a path under public/). Absent ⇒ a generated accent
  // poster. Supply your own art — don't bundle third-party box art unlicensed.
  coverImage?: string
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

// Only titles whose license clears the "🟢 Green bucket" bar in
// `docs/rom-licensing.md` (§4 + appendix) — 100% redistributable in a closed
// commercial app — are bundled here. Freeware / no-license / GPL titles were
// removed (see that doc's appendix for the audit). Add a title only after
// confirming its license covers code AND assets.
export const ROM_CATALOG: RomEntry[] = [
  {
    source: 'catalog',
    id: 'paddle-duel',
    title: 'Paddle Duel',
    system: 'nes',
    author: 'sebastiandine',
    license: 'zlib',
    description:
      'A one-on-one paddle duel — outlast the CPU in a test of pure reflex.',
    fileName: 'paddle-duel.nes',
    accent: 'text-emerald-400',
    coverImage: '/covers/paddle-duel.jpg',
  },
  {
    source: 'catalog',
    id: 'brick-buster',
    title: 'Brick Buster',
    system: 'nes',
    author: 'sebastiandine',
    license: 'zlib',
    description:
      'Angle the ball off your paddle and chip through the wall, brick by brick.',
    fileName: 'brick-buster.nes',
    accent: 'text-amber-400',
    coverImage: '/covers/brick-buster.jpg',
  },
  {
    source: 'catalog',
    id: 'opennes-snake',
    title: 'Snake',
    system: 'nes',
    author: 'sebastiandine',
    license: 'zlib',
    description:
      'Chase the dots to grow longer — but never cross your own tail.',
    fileName: 'snake.nes',
    accent: 'text-violet-400',
    coverImage: '/covers/opennes-snake.jpg',
  },
  {
    source: 'catalog',
    id: 'tobu-tobu-girl',
    title: 'Tobu Tobu Girl',
    system: 'gb',
    author: 'Tangram Games',
    license: 'MIT + CC-BY 4.0',
    description:
      'A vertical arcade climber — bounce off enemies to chase your runaway pet across the sky.',
    fileName: 'tobu-tobu-girl.gb',
    accent: 'text-sky-400',
    coverImage: '/covers/tobu-tobu-girl.jpg',
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
  // A ROM that isn't in the build doesn't 404 in production: the SPA rewrite
  // (`vercel.json`) serves index.html with a 200, so `response.ok` lies. Feeding
  // that HTML to the emulator drops it into RetroArch's menu ("failed to load
  // content"). Treat an HTML body as "not installed" and surface it cleanly.
  if ((response.headers.get('content-type') ?? '').includes('text/html')) {
    throw new RomNotFoundError(rom.fileName)
  }
  const blob = await response.blob()
  return new File([blob], rom.fileName)
}
