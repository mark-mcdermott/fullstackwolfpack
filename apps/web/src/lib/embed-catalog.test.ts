import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EMBED_LICENSES } from '@/core/games'
import { EMBED_CATALOG } from './embed-catalog'

// The license guard: every bundled embed game must ship its verbatim LICENSE and
// carry attribution metadata, so a credit can never silently go missing. Adding
// a game to the manifest without its LICENSE file on disk fails this test.
const GAMES_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../public/games',
)

describe('embed catalog', () => {
  it('lists at least one game', () => {
    expect(EMBED_CATALOG.length).toBeGreaterThan(0)
  })

  it('has unique ids and slugs', () => {
    const ids = EMBED_CATALOG.map((g) => g.id)
    const slugs = EMBED_CATALOG.map((g) => g.slug)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  for (const game of EMBED_CATALOG) {
    describe(`${game.title} (${game.license})`, () => {
      it('declares a known Green-bucket license', () => {
        expect(EMBED_LICENSES).toContain(game.license)
      })
      it('ships its verbatim LICENSE file', () => {
        expect(existsSync(join(GAMES_DIR, game.slug, 'LICENSE'))).toBe(true)
      })
      it('ships its entry file', () => {
        expect(existsSync(join(GAMES_DIR, game.slug, game.entry))).toBe(true)
      })
      it('carries author + source attribution', () => {
        expect(game.author.trim().length).toBeGreaterThan(0)
        expect(game.sourceUrl).toMatch(/^https?:\/\//)
        expect(game.licenseUrl).toMatch(/^https?:\/\//)
      })
    })
  }
})
