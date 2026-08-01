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
  // Optional cover art (a path under public/, e.g. `/games/2048/cover.png`). When
  // absent the gallery renders a generated accent poster. Supply your own art —
  // don't bundle third-party screenshots/box art without a clear license.
  coverImage?: string
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
    coverImage: '/covers/2048.jpg',
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
    coverImage: '/covers/hextris.jpg',
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
    coverImage: '/covers/hexgl.jpg',
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
  {
    source: 'embed',
    id: 'underrun',
    slug: 'underrun',
    entry: 'index.html',
    title: 'Underrun',
    author: 'Dominic Szablewski',
    license: 'MIT',
    licenseUrl: 'https://github.com/phoboslab/underrun/blob/master/LICENSE.md',
    sourceUrl: 'https://github.com/phoboslab/underrun',
    description:
      'A neon twin-stick shooter — carve through a derelict facility before the reactor blows. (js13k 2018.)',
    accent: 'text-rose-400',
    coverImage: '/covers/underrun.jpg',
  },
  {
    source: 'embed',
    id: 'astray',
    slug: 'astray',
    entry: 'index.html',
    title: 'Astray',
    author: 'Rye Terrell (wwwtyro)',
    license: 'Unlicense',
    licenseUrl: 'https://github.com/wwwtyro/Astray/blob/master/License.md',
    sourceUrl: 'https://github.com/wwwtyro/Astray',
    description:
      'Roll a marble through a first-person 3D maze and hunt down the exit — a tiny WebGL classic.',
    accent: 'text-emerald-400',
    coverImage: '/covers/astray.jpg',
    modifications:
      'Changed three absolute texture paths (/ball.png etc.) to relative so it loads inside the sandboxed iframe.',
  },
  {
    source: 'embed',
    id: 'hauberk',
    slug: 'hauberk',
    entry: 'index.html',
    title: 'Hauberk',
    author: 'Bob Nystrom',
    license: 'MIT',
    licenseUrl: 'https://github.com/munificent/hauberk/blob/master/COPYRIGHT',
    sourceUrl: 'https://github.com/munificent/hauberk',
    description:
      'A deep ASCII roguelike — descend a procedurally-generated dungeon, grab loot, and try not to die. (Keyboard; best on desktop.)',
    accent: 'text-orange-400',
    coverImage: '/covers/hauberk.jpg',
    modifications:
      'Removed a Google Fonts CDN link so the game makes no third-party requests (falls back to a system serif).',
  },
  {
    source: 'embed',
    id: 'chess',
    slug: 'chess',
    entry: 'index.html',
    title: 'Chess',
    author: 'Chris Oakman (chessboard.js)',
    license: 'MIT',
    licenseUrl: 'https://github.com/oakmac/chessboardjs/blob/master/LICENSE.md',
    sourceUrl: 'https://github.com/oakmac/chessboardjs',
    description:
      'Local two-player chess — legal moves enforced, alternating turns. Pass-and-play on one screen.',
    accent: 'text-sky-400',
    coverImage: '/covers/chess.jpg',
    // Assembled from four permissive components (see the bundled LICENSE).
    credits: [
      'Rules engine: chess.js by Jeff Hlywa (BSD 2-Clause)',
      'DOM library: jQuery (MIT, OpenJS Foundation)',
      'Piece art: Colin M.L. Burnett / Cburnett (3-clause BSD)',
    ],
  },
]

// Optional dedicated origin to serve `public/games/` from, for full cross-frame
// isolation of third-party game code. Empty (default) ⇒ same-origin under
// BASE_URL, which requires the iframe to keep `allow-same-origin`. Set
// VITE_GAMES_ORIGIN to a separate sandbox origin (e.g. https://games.example.com,
// serving the same static files) to drop `allow-same-origin`. Read at call time
// so it's stub-testable.
function gamesOrigin(): string {
  const v = import.meta.env.VITE_GAMES_ORIGIN as string | undefined
  return v ? v.replace(/\/+$/, '') : ''
}

// URL of an embed game's entry file (from the games origin, else same-origin).
export function embedGameUrl(entry: EmbedEntry): string {
  return `${gamesOrigin()}${import.meta.env.BASE_URL}games/${entry.slug}/${entry.entry}`
}

// True when games are served from a separate origin — the iframe can then drop
// `allow-same-origin` for full cross-origin isolation of the game code.
export function embedGamesCrossOrigin(): boolean {
  return gamesOrigin() !== ''
}
