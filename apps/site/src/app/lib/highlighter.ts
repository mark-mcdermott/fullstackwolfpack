import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { FW_DARK, FW_LIGHT } from './code-theme'

// A lazily-created, dependency-light syntax highlighter for lesson code blocks.
//
// It uses Shiki's **JavaScript regex engine** (not the WASM/Oniguruma one) so it runs
// inside the Capacitor (WKWebView) and Tauri webviews without SharedArrayBuffer /
// cross-origin isolation — which those surfaces can't provide. Only the grammars a
// developer-learning app needs are bundled, and every grammar/theme is a dynamic
// import, so nothing loads until the first code block mounts. See
// docs/education-system.md §4.2.

// Grammars we ship. Add a language here (and a dynamic import below) to support it.
const LANGS = [
  'typescript',
  'tsx',
  'javascript',
  'jsx',
  'json',
  'bash',
  'css',
  'html',
  'python',
  'sql',
  'markdown',
  // Added after an audit found these three silently rendering as plain text:
  // `c` in the machine lesson's C comparison, and `dockerfile` / `yaml`
  // throughout the Docker course. An unknown fence is not an error — it falls
  // back to `text` — so the only symptom is a block of flat, uncoloured code.
  // highlighter.test.ts now asserts every language the content actually uses
  // is loaded, since the content is generated and can introduce new ones.
  'c',
  'dockerfile',
  'yaml',
] as const
const LOADED = new Set<string>(LANGS)

// Common fence aliases → the grammar we actually loaded.
const ALIAS: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  py: 'python',
  md: 'markdown',
  yml: 'yaml',
  docker: 'dockerfile',
}


let singleton: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!singleton) {
    singleton = createHighlighterCore({
      // `forgiving` keeps a grammar the JS engine can't fully model from throwing —
      // it degrades to a partial highlight instead of erroring.
      engine: createJavaScriptRegexEngine({ forgiving: true }),
      // Bundled objects rather than dynamic imports: they are a few hundred
      // bytes of our own palette, not a theme to fetch.
      themes: [FW_LIGHT, FW_DARK],
      langs: [
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/tsx.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/jsx.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/langs/html.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/sql.mjs'),
        import('shiki/langs/markdown.mjs'),
        import('shiki/langs/c.mjs'),
        import('shiki/langs/dockerfile.mjs'),
        import('shiki/langs/yaml.mjs'),
      ],
    })
  }
  return singleton
}

// Resolve a fence language to one we actually loaded (unknown → plain text, which
// Shiki always supports without a grammar).
export function resolveLang(lang: string): string {
  const l = (ALIAS[lang] ?? lang).toLowerCase()
  return LOADED.has(l) ? l : 'text'
}

// Highlight code to a Shiki `<pre>` HTML string. The markup is produced entirely by
// Shiki from tokenised, escaped source — safe to inject (see CodeBlock).
//
// Emits BOTH themes at once. With `defaultColor: false`, Shiki writes each
// token's two colours as `--shiki-light` / `--shiki-dark` custom properties
// instead of picking one, and index.css chooses between them. That is what
// keeps the light/dark difference CSS-only, per the project rule: no component
// reads the theme, and nothing re-highlights when it changes.
export async function highlightToHtml(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang: resolveLang(lang),
    themes: { light: 'fw-light', dark: 'fw-dark' },
    defaultColor: false,
  })
}
