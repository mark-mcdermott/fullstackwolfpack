import type { ThemeRegistrationRaw } from 'shiki/core'

// FW-01's own syntax themes, one per mode.
//
// Replaces `github-dark`, which was used in both modes — so a light page had a
// GitHub-coloured block sitting in it, using purples and blues that appear
// nowhere else in the product.
//
// Both themes are built from the palette the rest of the app already uses: the
// brand red for keywords, and the green / amber / cyan accents the dark-mode
// pass settled on. Same hue in both modes, re-lit for the background it sits
// on — which is the same rule the two page themes follow.
//
// Two themes rather than one is also what keeps the switch CSS-only. Shiki
// emits both colours per token as `--shiki-light` / `--shiki-dark` custom
// properties, and a stylesheet picks; nothing re-highlights on toggle and no
// component reads the theme.

// Dark: a surface that sits *below* `--card` (#171e2c), so a block reads as
// recessed into the panel rather than as another card stacked on it.
const DARK_BG = '#10151f'
const DARK_FG = '#dfe3ea'

// Light: `--background` and `--card` are both pure white, so a code block has
// to bring its own surface or it has no edges at all. A cool near-white keeps
// the flat, solid feel of the light theme without becoming a grey slab.
const LIGHT_BG = '#f4f5f8'
const LIGHT_FG = '#1f2430'

// One entry per token role, so the two themes cannot drift apart.
//
// `scope` is the TextMate selector Shiki matches. `cssVar` is the same colour
// exposed to CodeMirror, which highlights by Lezer tag rather than by TextMate
// scope and so cannot share the theme object — see code-editor.tsx. The
// variables are declared in index.css and asserted against this list by
// code-theme.test.ts, so the two cannot drift apart either.
const ROLES: { scope: string[]; cssVar: string; dark: string; light: string }[] = [
  {
    // Comments carry the traces in these lessons ("// price = 10, tax = 2"),
    // so they are deliberately readable rather than whispered — they are
    // content here, not asides.
    scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
    cssVar: '--code-comment',
    dark: '#7d879c',
    light: '#636b79',
  },
  {
    scope: [
      'keyword',
      'keyword.control',
      'keyword.operator.new',
      'keyword.operator.expression',
      'storage.type',
      'storage.modifier',
    ],
    cssVar: '--code-keyword',
    dark: '#ff6b6b',
    light: '#c2352c',
  },
  {
    scope: ['string', 'string.quoted', 'punctuation.definition.string'],
    cssVar: '--code-string',
    dark: '#7fd8a0',
    light: '#1a7a52',
  },
  {
    scope: ['constant.numeric', 'constant.language', 'constant.character'],
    cssVar: '--code-number',
    dark: '#f0b866',
    light: '#96590a',
  },
  {
    scope: [
      'entity.name.function',
      'support.function',
      'meta.function-call.generic',
    ],
    cssVar: '--code-function',
    dark: '#6fc7e8',
    light: '#0f6d99',
  },
  {
    scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'],
    cssVar: '--code-type',
    dark: '#9ad9f5',
    light: '#1b5e8a',
  },
  {
    scope: ['variable', 'variable.other', 'meta.definition.variable'],
    cssVar: '--code-variable',
    dark: DARK_FG,
    light: LIGHT_FG,
  },
  {
    scope: ['variable.parameter'],
    cssVar: '--code-param',
    dark: '#e5c07b',
    light: '#8a5a00',
  },
  {
    scope: ['keyword.operator', 'punctuation', 'meta.brace'],
    cssVar: '--code-punctuation',
    dark: '#9aa4b6',
    light: '#5a6472',
  },
  {
    scope: ['entity.name.tag', 'support.type.property-name'],
    cssVar: '--code-tag',
    dark: '#ff8f8f',
    light: '#b03a30',
  },
  {
    scope: ['invalid', 'invalid.illegal'],
    cssVar: '--code-invalid',
    dark: '#ff6b6b',
    light: '#c2352c',
  },
]

function build(mode: 'dark' | 'light'): ThemeRegistrationRaw {
  return {
    name: `fw-${mode}`,
    type: mode,
    colors: {
      'editor.background': mode === 'dark' ? DARK_BG : LIGHT_BG,
      'editor.foreground': mode === 'dark' ? DARK_FG : LIGHT_FG,
    },
    settings: ROLES.map((r) => ({
      scope: r.scope,
      settings: { foreground: mode === 'dark' ? r.dark : r.light },
    })),
  }
}

export const FW_DARK = build('dark')
export const FW_LIGHT = build('light')

// Exported for the contrast test — every token colour has to stay legible on
// the surface it is printed on, and these are hand-picked hex values that a
// future palette tweak could quietly break.
export const CODE_SURFACES = { dark: DARK_BG, light: LIGHT_BG }
export const CODE_ROLES = ROLES
