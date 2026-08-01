import { describe, expect, it } from 'vitest'
import {
  ACCEPTED_EXTENSIONS,
  coreForSystem,
  MAX_ROM_BYTES,
  ROM_SYSTEMS,
  systemForExtension,
  validateRom,
} from './roms'

describe('coreForSystem', () => {
  it('maps every system to a non-empty libretro core', () => {
    for (const system of ROM_SYSTEMS) {
      expect(coreForSystem(system)).toMatch(/\S/)
    }
  })

  it('uses the expected cores', () => {
    expect(coreForSystem('nes')).toBe('fceumm')
    expect(coreForSystem('gb')).toBe('gambatte')
    expect(coreForSystem('gba')).toBe('mgba')
    expect(coreForSystem('genesis')).toBe('genesis_plus_gx')
  })
})

describe('systemForExtension', () => {
  it('infers the system from the file extension, case-insensitively', () => {
    expect(systemForExtension('Contra.NES')).toBe('nes')
    expect(systemForExtension('tobu.gb')).toBe('gb')
    expect(systemForExtension('demo.gbc')).toBe('gbc')
    expect(systemForExtension('demo.gba')).toBe('gba')
    expect(systemForExtension('sonic.md')).toBe('genesis')
    expect(systemForExtension('demo.smc')).toBe('snes')
  })

  it('handles names with multiple dots', () => {
    expect(systemForExtension('My Game (USA).v2.nes')).toBe('nes')
  })

  it('returns null for unknown or missing extensions', () => {
    expect(systemForExtension('notes.txt')).toBeNull()
    expect(systemForExtension('README')).toBeNull()
    expect(systemForExtension('archive.zip')).toBeNull()
  })
})

describe('ACCEPTED_EXTENSIONS', () => {
  it('covers every system and is dot-prefixed + lowercase', () => {
    expect(ACCEPTED_EXTENSIONS.length).toBeGreaterThan(0)
    for (const ext of ACCEPTED_EXTENSIONS) {
      expect(ext).toMatch(/^\.[a-z0-9]+$/)
    }
    for (const system of ROM_SYSTEMS) {
      const known = ACCEPTED_EXTENSIONS.some(
        (ext) => systemForExtension(`x${ext}`) === system,
      )
      expect(known).toBe(true)
    }
  })
})

describe('validateRom', () => {
  it('accepts a supported file within the size cap and returns its system', () => {
    const result = validateRom({ name: 'tobu-tobu-girl.gb', size: 32 * 1024 })
    expect(result).toEqual({ ok: true, system: 'gb' })
  })

  it('rejects unsupported file types', () => {
    const result = validateRom({ name: 'cheats.txt', size: 100 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/unsupported/i)
  })

  it('rejects empty files', () => {
    const result = validateRom({ name: 'empty.nes', size: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/empty/i)
  })

  it('rejects files over the size cap', () => {
    const result = validateRom({ name: 'huge.gba', size: MAX_ROM_BYTES + 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/large|max/i)
  })

  it('accepts a file exactly at the size cap', () => {
    const result = validateRom({ name: 'edge.gba', size: MAX_ROM_BYTES })
    expect(result).toEqual({ ok: true, system: 'gba' })
  })
})
