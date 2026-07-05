# Arcade content — non-ROM game lanes (verified-clear only)

> **Not legal advice** — engineering due-diligence. Companion to
> [`rom-licensing.md`](./rom-licensing.md); same **🟢 Green-bucket** bar (code
> AND assets clear for commercial bundling in a closed app).

## Why this doc exists

The bundle-safe *homebrew ROM* pool is nearly dry (see `rom-licensing.md`
appendix). The quality unlock is a second arcade lane: **self-hosted HTML5 games
in a sandboxed iframe** — no emulator, higher quality, and **touch-native** (so
it also sidesteps the "can't press Start on mobile" problem the ROM lane has).

## The rule (concrete steps OK, gray areas out)

Include a title only if compliance is a **concrete one-time step**:

- ✅ keep the license notice · show attribution (CC-BY) · ship the copyleft
  game's source (GPL/MPL — via its own iframe = mere aggregation; never reaches
  our app) · strip bundled ad/tracker scripts · rename to avoid a trademark.
- ❌ **out:** any judgment call / "consult a lawyer" gray area, emailing authors
  for permission, NonCommercial (`-NC`) anything, unverified assets, or
  "mostly legal but…".

**The recurring trap is assets, not code.** Verified live in this round:
- *The Evolution of Trust* (Nicky Case) — CC0 code, but bundles a **CC-BY-NC**
  sound → **excluded** (can't sell). *We Become What We Behold* is CC0 + CC-BY
  (clean-with-attribution) but has media-violence themes.
- *Hextris* shipped a **Google AdSense + Analytics** script → stripped from the
  vendored copy (GPL allows; noted in `FW-MODIFICATIONS.txt`).

## Verified-clear menu (by lane)

### 🟢 Open-source HTML5 games (the quality lane)
| Game | License | Notes |
|---|---|---|
| **2048** | MIT | Spotless, tiny, swipe-native. **Bundled.** |
| **Hextris** | GPL-3.0 | Addictive, mobile-perfect. Ship source (its repo). **Bundled** (ads stripped). |
| **HexGL** | MIT + PD/CC-BY audio | AAA-feel 3D racer; the showpiece. ~16 MB + 3 CC-BY sound credits. Ready to add (see below). |
| **Underrun** | MIT | Neon twin-stick shooter; procedural assets. |
| **Astray** | Unlicense (PD) | 3D tilt maze. |
| **cube-composer** | MIT | Functional-programming puzzle (on-brand). |
| **Hauberk** | MIT | Deep roguelike (desktop/keyboard). |
| **Chess** | MIT + BSD | chessboard.js + chess.js, local 2-player. |

### 🟢 Interactive fiction / text (self-contained HTML, no interpreter)
- Interpreters (all MIT/BSD/zlib): **Parchment/ZVM/Quixe** (Z-machine/Glulx),
  **inkjs** (ink), Twine story formats (Harlowe zlib / SugarCube BSD / Snowman·Chapbook MIT).
- **The Intercept** (inkle, MIT) · **Open Adventure** (BSD-2, the 1976 Colossal
  Cave) · CC0/Unlicense Twine games. Nicky Case's *code+art* is CC0 but verify
  each game's **sound** assets (the NC-audio trap above).

### 🟢 Retro, done right
- **Freedoom** + **Blasphemer** — BSD-3 data (real Doom/Heretic-quality FPS) on a
  GPL Doom-WASM engine (same posture as our existing GPL emulator cores).
- **Mystery House** — public domain (ScummVM web build).

### Dead ends (documented so we don't re-chase)
- **Flash / Ruffle** — Ruffle is MIT/Apache, but `.swf` games are all-rights-
  reserved; commercially-open Flash *games* are ~nonexistent.
- **classic DOS via js-dos** — js-dos is GPL (in-SPA bundling unsettled) + the
  good data (Tyrian/Doom/Wolf3D) isn't commercially free.
- **ScummVM adventure classics** (Beneath a Steel Sky, etc.) — license allows use
  "as part of a larger distribution" but not "charging for the game" → whether
  our arcade qualifies is a **judgment call** → gray area, out.
- **Ad-embed networks** (GameDistribution/GameMonetize) — legal, but inject their
  ads + revenue share (business decision: no).

## Architecture (this PR)

- `core/games.ts` — pure license domain (`EmbedLicense`, `attributionRequired`,
  `sourceOfferRequired`).
- `lib/embed-catalog.ts` — `EMBED_CATALOG` manifest (`slug`, `entry`, author,
  license, `licenseUrl`, `sourceUrl`, `credits?`, `modifications?`).
- `public/games/<slug>/` — the static game + its verbatim `LICENSE`. Governed by
  a **default-deny + whitelist** `.gitignore` (mirrors `public/roms/`).
- `components/embed-player.tsx` — sandboxed iframe + play-time attribution.
- `pages/app/credits.tsx` (`/app/credits`) — renders every game's attribution
  straight from the manifests.
- `lib/embed-catalog.test.ts` — **CI guard**: fails the build if a listed game is
  missing its `LICENSE`/entry or attribution. Credits can't silently go missing.

### Security posture (iframe sandbox)
The player uses `sandbox="allow-scripts allow-same-origin"` so these vetted,
source-reviewed, first-party static games run reliably (canvas/WebGL/storage).
That trades away cross-frame isolation. **Hardening path (roadmap):** serve
`public/games/` from a separate origin so `allow-same-origin` can be dropped.

## Adding a game later
1. Vendor its static build + verbatim `LICENSE` into `public/games/<slug>/`;
   strip any ad/tracker scripts (note it in `modifications`).
2. Add a manifest entry (+ `credits` for CC-BY assets); whitelist the folder.
3. `npm run test` — the guard verifies the LICENSE + entry.

**HexGL** is the intended next add (the showpiece): MIT + 3 CC-BY sound credits,
~16 MB; deferred from the first PR only for repo weight + real in-browser QA.
