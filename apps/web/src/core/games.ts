// Embed-lane license domain — the "🟢 Green bucket, code + assets both verified"
// rule from docs/rom-licensing.md, applied to self-hosted HTML5 games. Pure (no
// DOM, no fs) so it's shared by the manifest, the Credits page, and the CI
// license guard that keeps attributions from ever going missing.

export const EMBED_LICENSES = [
  'CC0',
  'Public Domain',
  'Unlicense',
  'MIT',
  'BSD-2',
  'BSD-3',
  'Zlib',
  'Apache-2.0',
  'CC-BY-4.0',
  'GPL-3.0',
  'MPL-2.0',
] as const

export type EmbedLicense = (typeof EMBED_LICENSES)[number]

// Public-domain dedications — no obligation at all.
const NO_OBLIGATION = new Set<EmbedLicense>(['CC0', 'Public Domain', 'Unlicense'])

// Copyleft — we must make that game's source available (a concrete step, and it
// never reaches our app: the game runs in its own iframe = mere aggregation).
const SOURCE_OFFER = new Set<EmbedLicense>(['GPL-3.0', 'MPL-2.0'])

// True when bundling requires keeping an attribution/notice — everything except
// the public-domain dedications (MIT/BSD/Zlib/Apache keep the notice; CC-BY and
// copyleft additionally require visible credit / source).
export function attributionRequired(license: EmbedLicense): boolean {
  return !NO_OBLIGATION.has(license)
}

export function sourceOfferRequired(license: EmbedLicense): boolean {
  return SOURCE_OFFER.has(license)
}
