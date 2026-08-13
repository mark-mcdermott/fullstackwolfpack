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

## Correction: the score may not exist at all

**2026-08-13, after the above was written.** Mark, who has played the game,
reports that Tobu Tobu Girl Deluxe gives **infinite lives, has no score, and
will not fail you in normal play**. That is first-hand experience against an
itch.io tag, and the tag loses: tags are author-supplied and routinely describe
a genre rather than a mechanic.

If that is right, the spike's central conclusion is dead. The battery is real —
the cartridge header is not in doubt — but it would be saving unlocked stages,
settings or progress rather than a high score, and there is no score to read
into XP.

What survives regardless, because it was observed rather than inferred:

- `saveSRAM()` returns an 8KB Blob and is a workable read path for *whatever*
  the game persists
- there is no memory-map API — no `_retro_*` exports — so heap scanning was
  never available as a fallback anyway
- reading SRAM under load crashes the core

**Do not build on this without confirming what the game actually stores.** The
one run that settles it is unchanged in shape but different in purpose: play,
reach whatever the game's end state is, dump SRAM, and see what moved off
`0xFF`. That tells you what is in there, rather than assuming.

The section below is left as written, as the record of an inference that ran
ahead of its evidence twice.

## Does the game even have a score?

Worth asking, because the first version of this spike **inferred** one from the presence of a battery, which is a guess dressed as a finding. Checked afterwards:

- The itch.io listing carries an explicit **"High Score"** tag and describes an arcade platformer with few-minute sessions.
- The developer, in the itch comments: *"Your progress should automatically be saved between session regardless of which console you're playing on."*

So: a score exists, and something persists to the battery. Note the build matters — the header reads `TOBUDX`, which is **Tobu Tobu Girl Deluxe**, not the 2017 original. The original's own page describes no scoring at all, so anyone reasoning from that release would reasonably conclude there is none.

Still unconfirmed: whether there is a **game over** as such. The description is "racing against the clock… before it is too late", so the fail state is likely a timer rather than lives, but no source says so plainly.

## What is not yet proven

The spike stopped short of the actual byte offset.

- The score is *probably* in SRAM — the battery, the "High Score" tag and the developer's note all point that way — but it was not observed, because reaching a fail state means genuinely playing. "Progress saved" could also mean unlocked stages rather than a score.
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
