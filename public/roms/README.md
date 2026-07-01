# ROMs

The **Arcade** page (`/app/arcade`) plays retro games in-browser via
[Nostalgist.js](https://nostalgist.js.org/) (libretro cores compiled to WASM).
This folder is where the **curated homebrew** binaries live. They are **not**
checked into the repo — game binaries are copyright-sensitive, so the maintainer
drops them in here (or ships them via the CDN) after confirming each title's
redistribution terms.

Everything still works without these files: the gallery renders from metadata,
and the **"Add your ROM"** upload tile lets any user play a game from their own
device (the bytes stay client-side and are never uploaded to a server).

## Adding the curated titles

The catalog lives in [`src/lib/rom-catalog.ts`](../../src/lib/rom-catalog.ts).
Each entry's `fileName` is the file the player fetches from `/roms/`. Drop the
matching, legally-obtained binary here:

| File | Title | System | Author | License |
| --- | --- | --- | --- | --- |
| `alter-ego.nes` | Alter Ego | NES | RetroSouls | Freeware |
| `lan-master.nes` | Lan Master | NES | Shiru | Freeware |
| `tobu-tobu-girl.gb` | Tobu Tobu Girl | Game Boy | Tangram Games | Open source |
| `ucity.gbc` | µCity | Game Boy Color | AntonioND | GPLv3 |
| `anguna.gba` | Anguna | Game Boy Advance | Nathan Tolbert | Freeware |

> These are well-known **homebrew** titles chosen because they are freely
> distributable — but licenses change and mirrors move. **Confirm the current
> terms from each author's official page before bundling.** To add or remove
> titles, edit `ROM_CATALOG`; supported systems/extensions live in
> `src/core/roms.ts`.

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
