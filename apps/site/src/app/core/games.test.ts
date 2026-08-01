import { describe, expect, it } from 'vitest'
import {
  attributionRequired,
  EMBED_LICENSES,
  sourceOfferRequired,
} from './games'

describe('attributionRequired', () => {
  it('is false only for public-domain dedications', () => {
    expect(attributionRequired('CC0')).toBe(false)
    expect(attributionRequired('Public Domain')).toBe(false)
    expect(attributionRequired('Unlicense')).toBe(false)
  })
  it('is true for every permissive/copyleft license (keep the notice)', () => {
    for (const l of EMBED_LICENSES) {
      if (l === 'CC0' || l === 'Public Domain' || l === 'Unlicense') continue
      expect(attributionRequired(l)).toBe(true)
    }
  })
})

describe('sourceOfferRequired', () => {
  it('is true only for copyleft licenses', () => {
    expect(sourceOfferRequired('GPL-3.0')).toBe(true)
    expect(sourceOfferRequired('MPL-2.0')).toBe(true)
    expect(sourceOfferRequired('MIT')).toBe(false)
    expect(sourceOfferRequired('CC-BY-4.0')).toBe(false)
    expect(sourceOfferRequired('CC0')).toBe(false)
  })
})
