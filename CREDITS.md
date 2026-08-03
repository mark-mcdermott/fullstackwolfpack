# Credits & third-party attribution

Third-party assets and how to credit them.

## Bundled arcade ROMs

All bundled titles clear the 🟢 Green bucket in
[`docs/rom-licensing.md`](docs/rom-licensing.md) (redistributable in a closed
commercial app). Binaries live in `apps/site/public/roms/`.

- **Paddle Duel** (from openNES-Pong), **Brick Buster** (from openNES-Breakout),
  **Snake** (from openNES-Snake) — © sebastiandine, **zlib** license —
  `github.com/sebastiandine/openNES-Pong` · `/openNES-Breakout` · `/openNES-Snake`.
  Paddle Duel / Brick Buster are our own trademark-safe names for these upstream
  clones. zlib permits commercial bundling with **no on-screen credit required**;
  we keep the copyright notice here for provenance. Built from source with cc65.
- **Tobu Tobu Girl** — © Tangram Games (Simon Larsen & Lukas Nuszkowski).
  Code **MIT**, assets **CC-BY 4.0** — `github.com/SimonLarsen/tobutobugirl`.
  CC-BY **requires attribution**, surfaced in-app on the arcade tile
  (`{author} · {license}`). Required credit: **"Tobu Tobu Girl by Tangram Games."**

## Active favicon — wolf mark

- **Where:** `apps/site/public/favicon.svg`.
- **What it is:** a single-path geometric wolf (Illustrator boilerplate stripped —
  ids, `<g>` wrapper, xml prolog removed). **Theme-adaptive:** fills `#0a0a0a`
  (matches `--foreground`) and swaps to `#fafafa` on dark browser chrome via an
  embedded `@media (prefers-color-scheme: dark)`.
- **Source:** Mark's own / in-house mark — **no attribution required.**
  _(If it was actually derived from a stock asset, say so and I'll add the credit.)_

## Archived — Vecteezy wolf (NOT currently used)

- [`credits/vecteezy_illustration-vector-graphic-of-wolves-icon_26184657.svg`](credits/vecteezy_illustration-vector-graphic-of-wolves-icon_26184657.svg)
  — kept for reference. **No longer the favicon.** Vecteezy's Free License requires
  attribution only if you actually ship it; since it's unused, no attribution is
  needed and this can be deleted if you don't want it around.
