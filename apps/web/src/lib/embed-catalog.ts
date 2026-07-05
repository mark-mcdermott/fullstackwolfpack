import type { EmbedLicense } from '@/core/games'

// A bundled, self-hosted HTML5 game (the "embed lane" — no emulator). The game
// lives as static files under `public/games/<slug>/` and plays in a sandboxed
// iframe. Every entry is verified 🟢 Green-bucket (code AND assets clear for
// commercial bundling); the CI guard in `embed-catalog.test.ts` refuses any
// entry missing its bundled LICENSE. See docs/arcade-content.md.
export type EmbedEntry = {
  source: 'embed'
  id: string
  slug: string // folder under public/games/
  entry: string // html entry file
  title: string
  author: string
  license: EmbedLicense
  licenseUrl: string
  sourceUrl: string // upstream repo — also satisfies the copyleft source-offer
  description: string
  // Tailwind text-color class for the tile's accent (matches the ROM tiles).
  accent: string
  // Extra attribution lines beyond author/license (e.g. CC-BY asset authors).
  credits?: string[]
  // Set when we modified the vendored copy (e.g. stripped ads/trackers) — GPL's
  // "mark your changes" obligation; rendered on the Credits page.
  modifications?: string
}

export const EMBED_CATALOG: EmbedEntry[] = [
  {
    source: 'embed',
    id: '2048',
    slug: '2048',
    entry: 'index.html',
    title: '2048',
    author: 'Gabriele Cirulli',
    license: 'MIT',
    licenseUrl: 'https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt',
    sourceUrl: 'https://github.com/gabrielecirulli/2048',
    description:
      'Slide the tiles, merge matching numbers, and chase the elusive 2048.',
    accent: 'text-amber-400',
  },
  {
    source: 'embed',
    id: 'hextris',
    slug: 'hextris',
    entry: 'index.html',
    title: 'Hextris',
    author: 'Hextris contributors',
    license: 'GPL-3.0',
    licenseUrl: 'https://github.com/Hextris/hextris/blob/master/LICENSE.md',
    sourceUrl: 'https://github.com/Hextris/hextris',
    description:
      'A fast, hexagonal take on falling-block puzzles — rotate the stack and clear the layers.',
    accent: 'text-cyan-400',
    modifications:
      'Removed the bundled Google AdSense + Google Analytics scripts (no ads / no third-party tracking).',
  },
  {
    source: 'embed',
    id: 'hexgl',
    slug: 'hexgl',
    entry: 'index.html',
    title: 'HexGL',
    author: 'Thibaut Despoulain (BKcore)',
    license: 'MIT',
    licenseUrl: 'https://github.com/BKcore/HexGL/blob/master/LICENSE',
    sourceUrl: 'https://github.com/BKcore/HexGL',
    description:
      'A fast, futuristic WebGL racer — carve the neon tracks at breakneck speed.',
    accent: 'text-fuchsia-400',
    // MIT code/resources; a few sound effects are CC-BY 3.0 (credit required),
    // the rest are public domain (see the vendored audio/LICENSE).
    credits: [
      'Sound "boost" by IFartInUrGeneralDirection (CC-BY 3.0)',
      'Sound "wind" by kangaroovindaloo (CC-BY 3.0)',
      'Sound "destroyed" by beman87 (CC-BY 3.0)',
    ],
    modifications:
      'Removed the bundled Google Analytics snippet and de-hotlinked the favicon.',
  },
]

// URL of an embed game's entry file, served from `public/games/`.
export function embedGameUrl(entry: EmbedEntry): string {
  return `${import.meta.env.BASE_URL}games/${entry.slug}/${entry.entry}`
}
