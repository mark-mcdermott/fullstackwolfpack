// Retro pixel-art badge emblems (VGA palette), rendered as crisp SVG rects by
// components/badge/pixel-badge.tsx. Each emblem is a 12×12 bitmap: one char per
// pixel, '.' = transparent, every other char keyed into EMBLEM_PALETTE. Kept
// data-only + dimension-checked in a test so the art can't silently drift.

export const GRID = 12

// A small VGA-ish palette. Keys are the chars used in the bitmaps below.
export const EMBLEM_PALETTE: Record<string, string> = {
  K: '#181820', // outline / near-black
  W: '#f6f7fb', // highlight white
  r: '#e23636', // red
  R: '#a01f2b', // dark red
  o: '#ff9020', // orange
  y: '#ffd23f', // yellow
  g: '#43c65a', // green
  G: '#1f7a3f', // dark green
  b: '#4a86e8', // blue
  B: '#274a9c', // dark blue
  c: '#42d4d4', // cyan
  p: '#9a55d6', // purple
  m: '#ef7fbf', // pink
  s: '#c9ccd6', // silver
  S: '#7f8494', // dark silver
  d: '#8a5a2a', // brown
}

// prettier-ignore
const EMBLEMS: Record<string, string[]> = {
  // Flame — streaks.
  'hot-streak': [
    '.....KK.....',
    '....KooK....',
    '....KooK....',
    '...KooyoK...',
    '..KooyyooK..',
    '..KoyyWyoK..',
    '.KooyWWyooK.',
    '.KoyyWWyyoK.',
    '.KooyyyyooK.',
    '..KooooooK..',
    '...KKKKKK...',
    '............',
  ],
  // Crown — legend.
  legend: [
    '............',
    '.K........K.',
    '.Ky......yK.',
    '.KyK....KyK.',
    '.KyKK..KKyK.',
    '.KyoyKKyoyK.',
    '.KyoyyyyoyK.',
    '.KyorooroyK.',
    '.KyyyyyyyyK.',
    '.KKKKKKKKKK.',
    '............',
    '............',
  ],
  // Trophy cup — top honor.
  'master-wolf': [
    '..KKKKKKKK..',
    '.KyyyyyyyyK.',
    'KyyWyyyyWyyK',
    'KyyyyyyyyyyK',
    '.KyyWWWWyyK.',
    '..KyyyyyyK..',
    '...KyyyyK...',
    '....KyyK....',
    '...KKyyKK...',
    '..KyyyyyyK..',
    '.KKKKKKKKKK.',
    '............',
  ],
  // Bullseye — focus mode.
  'focus-mode': [
    '....KKKK....',
    '..KKrrrrKK..',
    '.KrrWWWWrrK.',
    '.KrWWrrWWrK.',
    'KrWWrKKrWWrK',
    'KrWrKWWKrWrK',
    'KrWrKWWKrWrK',
    'KrWWrKKrWWrK',
    '.KrWWrrWWrK.',
    '.KrrWWWWrrK.',
    '..KKrrrrKK..',
    '....KKKK....',
  ],
  // Sunrise — early bird.
  'early-bird': [
    '............',
    '.....yy.....',
    'y..KyyyyK..y',
    '.y.KyWWyK.y.',
    '..KyyWWyyK..',
    '.KyyyyyyyyK.',
    'KyyyyyyyyyyK',
    '.KKKKKKKKKK.',
    '.WWWWWWWWWW.',
    '...WWWWWW...',
    '.....WW.....',
    '............',
  ],
  // Graduation cap — quiz master.
  'quiz-master': [
    '............',
    '.....KK.....',
    '...KKbbKK...',
    '.KKbbbbbbKK.',
    'KbbbbbbbbbbK',
    '.KKbbbbbbKK.',
    '...KKbbKKy..',
    '..Kbb..bKy..',
    '..Kb....bKy.',
    '..KbbbbbbK..',
    '...KKKKKK...',
    '............',
  ],
  // Star burst — perfectionist.
  perfectionist: [
    '.....KK.....',
    '.....yy.....',
    '..K..yy..K..',
    '.Ky.KyyK.yK.',
    '..KyyyWyyK..',
    '.KyyWWWWyyK.',
    'yyKWWyyWWKyy',
    '.KyyWWWWyyK.',
    '..KyyyWyyK..',
    '.Ky.KyyK.yK.',
    '..K..yy..K..',
    '.....KK.....',
  ],
  // Bug — bug hunter.
  'bug-hunter': [
    '..K......K..',
    '...K.KK.K...',
    '....KrrK....',
    '.KKKrrrrKKK.',
    'KrrKrWWrKrrK',
    'KrrrrrrrrrrK',
    '.KrrKrrKrrK.',
    'KrrrKrrKrrrK',
    '.KKKrrrrKKK.',
    '....KrrK....',
    '...K.KK.K...',
    '..K......K..',
  ],
  // Terminal prompt >_ — cli commander.
  'cli-commander': [
    '.KKKKKKKKKK.',
    '.KGGGGGGGGK.',
    '.KGKgg....GK',
    '.KGGKgg...GK',
    '.KGGGKgg..GK',
    '.KGGKgg...GK',
    '.KGKgg....GK',
    '.KGggggg..GK',
    '.KGGGGGGGGK.',
    '.KKKKKKKKKK.',
    '............',
    '............',
  ],
  // CPU chip — learning machine.
  'learning-machine': [
    '..K.K.K.K...',
    '.KKKKKKKKK..',
    'KbbbbbbbbbK.',
    'KbWWWWWWWbK.',
    'KbWKcccKWbK.',
    'KbWccccWbK..', // filled core
    'KbWKcccKWbK.',
    'KbWWWWWWWbK.',
    'KbbbbbbbbbK.',
    '.KKKKKKKKK..',
    '..K.K.K.K...',
    '............',
  ],
  // { } code braces — typescript novice.
  'typescript-novice': [
    '............',
    '.KKKKKKKKKK.',
    '.KbWWbbWWbK.',
    '.KbWbbbbWbK.',
    '.KWWbbbbWWK.',
    '.KbWbbbbWbK.',
    '.KbWbbbbWbK.',
    '.KbWWbbWWbK.',
    '.KKKKKKKKKK.',
    '............',
    '............',
    '............',
  ],
  // Calendar with a check — week warrior.
  'week-warrior': [
    '..K......K..',
    '.KKKKKKKKKK.',
    '.KrrrrrrrrK.',
    '.KWWWWWWWWK.',
    '.KWWWWWWgWK.',
    '.KWWWWWggWK.',
    '.KWgWWgggWK.',
    '.KWggggggWK.',
    '.KWWgggWWWK.',
    '.KWWWgWWWWK.',
    '.KKKKKKKKKK.',
    '............',
  ],
}

export function pixelEmblem(slug: string): string[] {
  return EMBLEMS[slug] ?? EMBLEMS.perfectionist
}

export const EMBLEM_SLUGS = Object.keys(EMBLEMS)
