# Bundled web games (the arcade "embed lane")

Each subfolder is a **self-hosted, static HTML5 game** played in a sandboxed
iframe (`components/embed-player.tsx`). The gallery + attribution are driven by
the manifest in `src/lib/embed-catalog.ts`; the CI guard
(`src/lib/embed-catalog.test.ts`) fails the build if a listed game is missing its
`LICENSE` or entry file.

## Legal bar (unchanged from `docs/rom-licensing.md`)

Only **🟢 Green-bucket** games belong here: **code AND assets** both verified
clear for commercial bundling — CC0 / public-domain / MIT / BSD / zlib / Apache
/ CC-BY, or GPL/MPL (concrete source-offer, satisfied by the vendored source +
`sourceUrl`). No NonCommercial assets, no unverified licenses. The `.gitignore`
is default-deny + explicit whitelist so nothing ships by accident.

## Adding a game

1. Vendor the game's static build into `public/games/<slug>/`, including its
   verbatim upstream `LICENSE`.
2. Strip any third-party ad/tracker scripts (record the change in the manifest's
   `modifications` field — see Hextris).
3. Add an entry to `EMBED_CATALOG` with author, license, `licenseUrl`,
   `sourceUrl`, and any extra `credits` (e.g. CC-BY asset authors).
4. Whitelist the folder in `.gitignore`.
5. `npm run test` — the license guard verifies the LICENSE + entry exist.

## Bundled

- **2048/** — MIT · Gabriele Cirulli · https://github.com/gabrielecirulli/2048
- **hextris/** — GPL-3.0 · Hextris contributors · https://github.com/Hextris/hextris
  (bundled Google AdSense + Analytics removed)
- **hexgl/** — MIT + PD/CC-BY audio · Thibaut Despoulain · https://github.com/BKcore/HexGL
  (Google Analytics removed; see `FW-MODIFICATIONS.txt`)
