import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CODE_ROLES, CODE_SURFACES, FW_DARK, FW_LIGHT } from './code-theme'

// The palette is written twice by necessity: once here as a Shiki theme, and
// once in index.css as `--code-*` variables, because CodeMirror highlights by
// Lezer tag and cannot read a TextMate theme. Nothing structural keeps the two
// equal, so this asserts it — a colour tweaked in one place and not the other
// would otherwise show up as an exercise that quietly disagrees with the code
// block above it.
// Resolved from the Vitest root (apps/site) rather than import.meta.url, which
// is not a file:// URL under the dev-server transform.
const css = readFileSync(resolve(process.cwd(), 'src/app/index.css'), 'utf8')

// `:root { … }` holds light; `.dark { … }` holds dark. Both declare the same
// variable names, so the order of appearance is what separates them.
function cssVars(): { light: Map<string, string>; dark: Map<string, string> } {
  const light = new Map<string, string>()
  const dark = new Map<string, string>()
  const darkAt = css.indexOf('.dark {')
  for (const m of css.matchAll(/(--code-[a-z-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
    const target = m.index! > darkAt && darkAt !== -1 ? dark : light
    target.set(m[1], m[2].toLowerCase())
  }
  return { light, dark }
}

describe('code palette', () => {
  const { light, dark } = cssVars()

  it('declares every role as a CSS variable in both modes', () => {
    for (const role of CODE_ROLES) {
      expect(light.has(role.cssVar), `light ${role.cssVar}`).toBe(true)
      expect(dark.has(role.cssVar), `dark ${role.cssVar}`).toBe(true)
    }
  })

  it('keeps the CSS variables equal to the Shiki palette', () => {
    for (const role of CODE_ROLES) {
      expect(light.get(role.cssVar), `light ${role.cssVar}`).toBe(
        role.light.toLowerCase(),
      )
      expect(dark.get(role.cssVar), `dark ${role.cssVar}`).toBe(
        role.dark.toLowerCase(),
      )
    }
  })

  it('declares the code surface in both modes', () => {
    expect(light.get('--code-surface')).toBe(CODE_SURFACES.light.toLowerCase())
    expect(dark.get('--code-surface')).toBe(CODE_SURFACES.dark.toLowerCase())
  })

  it('builds two Shiki themes that differ only by mode', () => {
    expect(FW_LIGHT.name).toBe('fw-light')
    expect(FW_DARK.name).toBe('fw-dark')
    expect(FW_LIGHT.type).toBe('light')
    expect(FW_DARK.type).toBe('dark')
    // Same roles in the same order — the two are generated from one list, and
    // this is what proves it stays that way.
    expect(FW_LIGHT.settings?.map((s) => s.scope)).toEqual(
      FW_DARK.settings?.map((s) => s.scope),
    )
  })

  // Every colour is hand-picked, and a future palette tweak could quietly drop
  // one below legibility. Comments especially: in these lessons they carry the
  // line-by-line traces, so they are content rather than asides.
  it('keeps every token legible on its surface (WCAG AA)', () => {
    const lum = (h: string) => {
      const n = parseInt(h.slice(1), 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        .map((v) => {
          const c = v / 255
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        })
        .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0)
    }
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    for (const mode of ['light', 'dark'] as const) {
      for (const role of CODE_ROLES) {
        const r = ratio(role[mode], CODE_SURFACES[mode])
        expect(r, `${mode} ${role.cssVar} = ${role[mode]}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})
