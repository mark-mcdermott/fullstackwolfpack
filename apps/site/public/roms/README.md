# ROMs

The **Arcade** page (`/app/arcade`) plays retro games in-browser via
[Nostalgist.js](https://nostalgist.js.org/) (libretro cores compiled to WASM).
This folder is where the **curated homebrew** binaries live. By default they are
**not** checked into the repo — game binaries are copyright-sensitive. The
**exception** is titles that clear the 🟢 Green-bucket bar in
[`docs/rom-licensing.md`](../../../../docs/rom-licensing.md) (100% redistributable
in a closed commercial app): those are whitelisted in `.gitignore` and bundled.
Everything else stays local-only (or ships via a CDN/Blob later).

Everything still works without these files: the gallery renders from metadata,
and the **"Add your ROM"** upload tile lets any user play a game from their own
device (the bytes stay client-side and are never uploaded to a server).

## Adding the curated titles

The catalog lives in [`src/lib/rom-catalog.ts`](../../src/lib/rom-catalog.ts).
Each entry's `fileName` is the file the player fetches from `/roms/`.

**Bundled now (verified 🟢 Green — committed to the repo):**

| File | Title | System | Author | License | Source |
| --- | --- | --- | --- | --- | --- |
| `paddle-duel.nes` | Paddle Duel | NES | sebastiandine | zlib | `github.com/sebastiandine/openNES-Pong` |
| `brick-buster.nes` | Brick Buster | NES | sebastiandine | zlib | `github.com/sebastiandine/openNES-Breakout` |
| `snake.nes` | Snake | NES | sebastiandine | zlib | `github.com/sebastiandine/openNES-Snake` |
| `tobu-tobu-girl.gb` | Tobu Tobu Girl | Game Boy | Tangram Games | MIT (code) + CC-BY 4.0 (assets) | `github.com/SimonLarsen/tobutobugirl` |

The three openNES titles are C source (no prebuilt ROM) — build the `.nes` with
[cc65](https://cc65.github.io/) (`brew install cc65`, then `sh build/build.sh`
in each repo) before dropping it here.

**Removed from the catalog** (were "freeware"/no-license/GPL — not clearly
Green; see the `docs/rom-licensing.md` appendix): Alter Ego, Lan Master, µCity
(GPLv3 — reinstatable if we ship a source offer + GPL notice), Anguna. Their
local binaries, if present, stay `.gitignore`d.

> **Only bundle titles whose license covers code AND assets** and permits
> commercial redistribution (Green bucket). Don't infer from "homebrew"/
> "freeware" — verify each title's actual LICENSE. To add one: drop the binary
> here, whitelist it in `.gitignore`, and add a `ROM_CATALOG` entry. Supported
> systems/extensions live in `src/core/roms.ts`.

## Supported systems

NES (`.nes`), Game Boy (`.gb`), Game Boy Color (`.gbc`), Game Boy Advance
(`.gba`), Genesis / Mega Drive (`.md` `.gen` `.smd`), SNES (`.sfc` `.smc`).
The extension → libretro core map is `SYSTEM_META` in `src/core/roms.ts`.

## Cores (Capacitor / Tauri offline)

By default Nostalgist fetches the core `.wasm` from a CDN, which is fine for the
web build. For the **Capacitor (mobile)** and **Tauri (desktop)** shells you'll
want the cores bundled so games run offline and pass app review. Self-host the
core files and point `launchRom` at them via Nostalgist's
`resolveCoreJs` / `resolveCoreWasm` options in
[`src/lib/emulator.ts`](../../src/lib/emulator.ts). See the Nostalgist docs on
[custom cores](https://nostalgist.js.org/apis/configuration/#core).
