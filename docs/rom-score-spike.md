# Spike: reading a score out of a ROM

**Question.** Can the app read Tobu Tobu Girl's score out of the running emulator, so play could feed XP the way lessons do — instead of the arcade being a black box the rest of the product knows nothing about?

**Answer.** Yes, and by a much better route than expected. Not by scanning emulator memory: by reading the cartridge's **battery-backed save RAM**, which Nostalgist already exposes as a supported API.

Run 2026-08-13 against `gambatte` via Nostalgist, driving the real `/play` page in Chrome.

---

## What the cartridge says

The decisive fact took one file read, no emulator:

```
title       'TOBUDX'
cart type   0x03  MBC1+RAM+BATTERY
ROM size    0x03  (256 KB)
RAM size    0x02  8KB
```

`0x03` means **MBC1 + RAM + BATTERY**: 8KB of save RAM with a battery to keep it. A homebrew arcade game carries a battery for essentially one reason — to remember a high score between sessions.

Read it from any `.gb` yourself: cartridge type is byte `0x147`, RAM size `0x149`.

## What the emulator exposes

| probe | result |
|---|---|
| `saveSRAM()` | **`Blob`, 8192 bytes** — all `0xFF` on a fresh boot |
| `saveState()` | throws `fs timeout` |
| `getEmscriptenModule().HEAPU8` | present, **134,217,728 bytes** |
| `_retro_*` exports | **none** — 72 module keys, no libretro API |

Two of those matter.

**There is no memory-map API.** Without `retro_get_memory_data`, there is no supported way to ask "where does Game Boy WRAM live in this heap". `HEAPU8` is reachable, but finding a two-byte score inside 128MB means an unguided scan against an address that the core is free to move between versions. That is the fragile, per-title reverse engineering this spike was meant to price — and it is now the *fallback*, not the plan.

**SRAM is the supported path.** 8KB, returned by a public method, and its layout belongs to the *game*, not the emulator — so it does not drift when the core is upgraded. Whatever the game writes there it will keep writing there forever.

## What is not yet proven

The spike stopped short of the actual byte offset.

- The score is *very likely* in SRAM — the battery says so — but that was not observed, because reaching a game-over means genuinely playing.
- Programmatic mashing (`press('start')` / `press('a')` in a tight loop) crashed the emulator: `saveSRAM()` then threw `RuntimeError: memory access out of bounds`. So **reading SRAM while the core is running is not safe under load** — a real implementation should pause first, or read on a game-over / exit event rather than polling.

## If this is picked up

1. Play to a game-over by hand, dump SRAM, and note it.
2. Play again to a *different* score, dump again.
3. Diff the two 8KB blobs. A score field is a handful of bytes that changed; a checksum may change too. Confirm by predicting the third value before dumping it.
4. Wrap it behind `EmulatorSession` in `lib/emulator.ts` — the one file that touches Nostalgist — as something like `readSaveRam(): Promise<Uint8Array>`, with a per-title parser beside the ROM catalog entry. Nothing else in the app should know what a cartridge is.

**It cannot be trusted for a leaderboard.** SRAM is client-side, so anything posted to the server is a number the player could have written by hand. Fine for personal XP and streaks; not fine for ranking people against each other without a server-side notion of a session.

## The cheaper 80%

"Frankensteined" is probably less about the score than about the app knowing nothing about the play session. Per-title **playtime is already tracked** (`game_playtime`, `/api/me/playtime`), so session length, return rate and "did they come back to this title" are available today with no cartridge work at all. Worth exhausting before committing to per-game reverse engineering.

## Related

- `apps/site/src/app/lib/emulator.ts` — the only file that touches Nostalgist; any memory API belongs here
- `apps/site/src/app/lib/rom-catalog.ts` — per-title metadata; a save-RAM parser belongs beside it
- [`arcade-content.md`](arcade-content.md), [`rom-licensing.md`](rom-licensing.md)
