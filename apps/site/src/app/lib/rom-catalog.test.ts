import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  loadRomFile,
  prettyTitle,
  ROM_CATALOG,
  RomNotFoundError,
  uploadedRomFromFile,
} from './rom-catalog'

afterEach(() => vi.unstubAllGlobals())

describe('prettyTitle', () => {
  it('turns a filename into a display title', () => {
    expect(prettyTitle('tobu-tobu-girl.gb')).toBe('Tobu Tobu Girl')
    expect(prettyTitle('super_mario.bros.nes')).toBe('Super Mario Bros')
  })
})

describe('uploadedRomFromFile', () => {
  it('builds a deterministic id and pretty title', () => {
    const file = new File([new Uint8Array([1, 2])], 'my-game.gba')
    const rom = uploadedRomFromFile(file, 'gba')
    expect(rom).toMatchObject({
      source: 'upload',
      id: 'upload:my-game.gba:2',
      title: 'My Game',
      system: 'gba',
      file,
    })
  })
})

describe('loadRomFile', () => {
  it('returns an uploaded ROM as-is without fetching', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const file = new File([new Uint8Array([9])], 'x.gba')

    await expect(loadRomFile(uploadedRomFromFile(file, 'gba'))).resolves.toBe(
      file,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches a catalog ROM and wraps it as a File named after the entry', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        blob: async () => blob,
      })),
    )
    const entry = ROM_CATALOG[0]

    const file = await loadRomFile(entry)
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe(entry.fileName)
    expect(file.size).toBe(4)
    expect(fetch).toHaveBeenCalledWith(`/roms/${entry.fileName}`)
  })

  it('throws RomNotFoundError when the catalog ROM is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    )
    await expect(loadRomFile(ROM_CATALOG[0])).rejects.toBeInstanceOf(
      RomNotFoundError,
    )
  })

  // In prod a missing /roms/*.nes hits the SPA rewrite → index.html with a 200,
  // not a 404. Without this guard the emulator would try to boot an HTML page.
  it('throws RomNotFoundError when the SPA fallback returns HTML with a 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        blob: async () => new Blob(['<!doctype html><title>app</title>']),
      })),
    )
    await expect(loadRomFile(ROM_CATALOG[0])).rejects.toBeInstanceOf(
      RomNotFoundError,
    )
  })
})
