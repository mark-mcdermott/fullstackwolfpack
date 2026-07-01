# ROM & emulator-core licensing — can we bundle, and can we stay closed?

> **Not legal advice.** This is an engineering/product analysis of well-known
> licenses so we can make an informed call. Before a *commercial* launch that
> bundles GPL cores, have a lawyer bless the "core = separate program"
> position (see §2). The rest is low-risk if we follow the buckets below.

## TL;DR

1. **The cores are the bigger problem, not the ROMs.** Two of our six emulator
   cores — **`snes9x` (SNES)** and **`genesis_plus_gx` (Genesis)** — are
   **non-commercial** licensed. They *cannot* ship in a paid/commercial product.
   `snes9x`'s license literally forbids "commercial game bundles." **Swap these
   before charging money.**
2. **Yes, you can keep the app 100% proprietary/closed.** Copyleft on a bundled
   ROM or a dynamically-loaded emulator core does **not** reach your unrelated
   app source (it's *mere aggregation* / separate programs — §2). Your code stays
   closed.
3. **For ROMs that "100% allow bundling AND don't touch our source," the answer
   is the Green bucket:** **CC0 / public-domain, MIT / BSD / zlib / Apache-2.0,
   and CC-BY.** These permit commercial bundling with zero obligation on your app
   (CC-BY just needs an attribution line).
4. **The trap:** "homebrew" and "freeware" ≠ redistributable. Most freeware is
   *personal-use only* or grants no redistribution at all. Silence = all rights
   reserved. **Verify every title's actual license file; don't infer from
   "homebrew."**
5. **Lowest-risk option:** don't bundle at all — keep ROMs **user-supplied**
   (what the app does today: upload your own). Then only the *core* licensing
   matters. Bundling a small curated Green-bucket set is a nice UX add on top.

---

## 1. Two separate licensing surfaces

The arcade has **two** things with licenses, and they're independent:

- **(A) The emulator cores** — `nostalgist` loads libretro/RetroArch WASM cores
  (`apps/web/src/core/roms.ts` → `SYSTEM_META`). We ship/point at these.
- **(B) The ROMs** — today user-uploaded; the question is whether we can *bundle*
  a curated set.

You must clear **both** to ship a commercial product.

## 2. Does copyleft force us to open our source? (No.)

The fear is that a GPL/share-alike ROM or core "infects" our proprietary app.
It doesn't, for two reasons:

- **A ROM is data.** The emulator loads it at runtime; it's not linked into or
  derived from our code. Bundling it alongside the app is **mere aggregation** —
  copyleft applies to the ROM itself, never to unrelated software shipped with it.
- **A libretro core is a separate program.** It's a standalone WASM module loaded
  dynamically across the Nostalgist boundary — the RetroArch model is explicitly
  built this way. Under the common (FSF-style) reading, that's aggregation, so a
  **GPL core does not open our app**.

**What copyleft *does* require** (obligations attach to the GPL/SA *work*, not to
us as a whole):

- If we **distribute** a GPL core's binary (self-host the WASM), we must offer
  **that core's source**, keep it GPL, add no restrictions, and ship its notices.
- A **GPL / CC-BY-SA ROM**, bundled unmodified, must stay under its license +
  keep attribution/source availability. Fine — just an operational burden.

> ⚠️ The one place to get a lawyer's sign-off for a *commercial* launch: the
> "core is a separate program, not a derivative of our app" position. Practice
> and the libretro ecosystem support it, but money on the line deserves the nod.

## 3. Emulator cores — current status & the commercial-safe swap

| System | Current core | License | Commercial? | Action |
|---|---|---|---|---|
| NES | `fceumm` | GPLv2 | ✅ (GPL obligations on the core) | keep |
| GB/GBC | `gambatte` | GPL | ✅ | keep |
| GBA | `mgba` | **MPL-2.0** | ✅ **cleanest** (file-level copyleft only) | keep |
| Genesis | `genesis_plus_gx` | **Non-commercial** | ❌ | **swap → `blastem` (GPLv3)** |
| SNES | `snes9x` | **Non-commercial** | ❌ | **swap → `mesen-s` or `beetle_bsnes` (GPLv3)** |

- **Avoid `picodrive`** for Genesis — it's under the **MAME license**
  (non-commercial). `blastem` (GPLv3) is the commercial-safe Genesis core.
- **`mgba` (MPL-2.0) is the model to prefer** where a choice exists: weak,
  file-level copyleft, no app-level obligations. `mgba` can also run GB/GBC.
- The GPL cores (`fceumm`, `gambatte`, `blastem`, `mesen-s`) are commercial-OK as
  long as we honor §2's core obligations.

> Note: today cores are fetched from **Nostalgist's default CDN**, so we're not
> even distributing the binaries ourselves — but a commercial product shouldn't
> depend on a third-party CDN *and* the non-commercial cores' terms restrict
> **use**, not just distribution. Plan to **self-host the commercial-safe cores**
> and drop the two non-commercial ones.

## 4. ROM licensing buckets

The bar you set — *"100% allows bundling AND won't force our source open"* — is
exactly the **Green** bucket.

### 🟢 Green — bundle freely in a closed commercial app
- **CC0 / Public Domain / The Unlicense** — no obligations at all.
- **MIT / BSD / zlib / Apache-2.0** — bundle freely; keep the license/notice file.
- **CC-BY 4.0** — bundle freely (incl. commercial); just credit the author.

None of these touch your app's proprietary status.

### 🟡 Yellow — bundle-able, with obligations (still doesn't open your app)
- **CC-BY-SA** — the ROM & its derivatives stay CC-BY-SA + attribution. Fine to
  ship *unmodified*; doesn't reach your app.
- **GPL / GPLv3 game ROMs** — aggregation (§2): app stays closed, but you must
  offer the ROM's source + keep it GPL. Accept the burden or skip.

### 🔴 Red — do NOT bundle in a commercial product
- **Non-commercial** (CC-BY-**NC**, "personal use only" freeware) — kills paid
  bundling outright.
- **"Freeware" / "free download" with no explicit redistribution + commercial
  grant** — default is *all rights reserved*. Silence ≠ permission.
- **Unknown / unclear** license — treat as Red until proven otherwise.
- **MAME-licensed** content.

## 5. Where to find clearly-licensed homebrew (then verify each)

Good starting points — but **open each title's own LICENSE/readme and confirm
it's Green** before bundling:

- **Homebrew Hub** (`hh.gbdev.io`) — large GB/GBC/GBA/NES homebrew archive; many
  entries list a license.
- **OpenGameArt.org** — CC0/public-domain NES content (commercial-OK by design).
- **Zophar's Domain → Public Domain ROMs** — GB and NES PD collections.
- **itch.io** homebrew with an explicit CC0/MIT/CC-BY license field + source.
- Prefer titles that **publish source under a permissive/CC license** — those are
  the safest and easiest to attribute.

Do **not** treat NESdev-compo/"homebrew" status as a license. Many great
homebrews are commercial (e.g., *Micro Mages*) or personal-use-only.

## 6. Recommended plan

**Option 0 (lowest risk, ship now): keep ROMs user-supplied.** The app already
takes uploads (`validateRom`). No ROM distribution = no ROM licensing exposure.
You still must do the **core swap** in §3. This is the safe default.

**Option 1 (nice UX): bundle a small curated Green set.** A handful of
CC0/MIT/CC-BY homebrew "instant-play" demos so a new user sees the arcade work
without owning ROMs. Requirements:

1. **Core swap** (§3): drop `snes9x`/`genesis_plus_gx`; add `blastem` +
   `mesen-s`/`beetle_bsnes`; self-host the commercial-safe cores.
2. **Per-ROM license manifest** — every bundled ROM carries its license +
   author + source URL, shown in-app (attribution) and kept for provenance.
   Suggested shape for the **arcade pane** to fold into `core/roms.ts` (I did not
   touch arcade files — this is a recommendation):

   ```ts
   type BundledRom = {
     id: string
     title: string
     system: RomSystem
     file: string          // /roms/<file>
     license: 'CC0' | 'MIT' | 'BSD' | 'Zlib' | 'Apache-2.0' | 'CC-BY-4.0'
     author: string
     sourceUrl: string     // where it came from + its license
   }
   ```
3. **Ship a `LICENSES/` / `THIRD-PARTY.md`** with each ROM's + core's license
   text and attributions.
4. Keep the app **proprietary** — nothing above requires opening it.

## 7. On keeping the app proprietary/closed — my take

**Do it.** For a commercial product, closed source is the right default and it's
fully compatible with everything above:

- Copyleft on bundled ROMs/cores stays *on those files* — it never reaches your
  app code (§2).
- The only real work is **hygiene**: swap the two non-commercial cores, stick to
  Green-bucket ROMs (or accept GPL/SA obligations on the yellow ones), ship the
  notices/source-offers for the GPL cores you distribute, and keep a manifest.
- Get a lawyer to bless the GPL-core aggregation stance before you charge money —
  that's the single genuine open question; the rest is mechanical compliance.

The thing that would *actually* force your source open is linking GPL code into
**your app's** build — which we don't do. Loading a core and reading a ROM at
runtime is not that.

---

## Appendix — verified clear-license titles (no caveats)

Every title below I **opened and confirmed** the license covers the **whole game
(code + assets)** and **permits commercial bundling** with no source-opening
obligation. Titles whose *code* was permissive but whose *assets* were unstated
or non-commercial are deliberately **excluded** (see "What didn't make it").

### 🟢 Bundle-safe in a closed commercial app

**NES** — all three by *sebastiandine*, license **zlib** (bundle + sell freely;
keep the copyright notice in your source/docs; no on-screen credit needed; whole
repo is zlib — simple C clones, dev-authored graphics, no third-party assets;
build the `.nes` with cc65):
- **openNES-Pong** — `github.com/sebastiandine/openNES-Pong`
- **openNES-Breakout** — `github.com/sebastiandine/openNES-Breakout`
- **openNES-Snake** — `github.com/sebastiandine/openNES-Snake`

**Game Boy / Color**
- **Tobu Tobu Girl** — **MIT (code) + CC-BY-4.0 (assets)** —
  `github.com/SimonLarsen/tobutobugirl`. Explicitly dual-licensed so the *whole
  game* is covered; commercial bundling OK; one firm, clear condition —
  **credit the author** (CC-BY). Build the `.gb` from source.

### Why the list is this short (evidence, not laziness)

Genuinely no-caveat, whole-game, commercially-bundle-able homebrew is **rare**:

- The curated **GBA database** (`gbadev-org/games`) lists **189 games** — only
  **2 are MIT**, 3 MPL-2.0; everything else is GPL or has **no license field**.
- Even those failed the whole-game bar: **MeteoRain** (MIT code) bakes in
  **CC-BY-NC** music (non-commercial → can't sell); **Skyland** and the **agb**
  demos (*The Hat Chooses the Wizard*, *The purple night*) license the *code*
  MPL-2.0 but **state no asset license**.
- **Disassemblies** (pret's Pokémon, Link's Awakening DX) are MIT **on the
  decompilation work** — the game is still Nintendo's IP → **not bundle-able**.
- **Collections** (retrobrews) say *"approved for distribution here only —
  contact the owner to share"* → not a redistribution grant.
- Prolific devs (e.g. **Shiru**) ship source but **state no license** on most
  titles → unverifiable.
- **CC0** in homebrew is almost always **asset packs**, not finished games.
- **SNES & Genesis:** no games meeting the bar were found — only permissively
  licensed *dev kits* (e.g. SGDK is MIT), not shippable games.

### How to grow the list legitimately

1. Accept only a license covering **code AND assets** (or a whole-game
   CC0 / zlib / MIT+CC-BY statement). The README's *assets/music* line is where
   it usually breaks — check it every time.
2. Exclude disassemblies of commercial games, "freeware / personal use," NC
   music, and "contact us to share" collections.
3. **Highest-yield lever:** email the author for **written permission to bundle
   commercially**. Most hobbyist devs will grant it — a one-line grant turns a
   freeware title into a clear-for-you title. Keep the emails on file.
4. Relaxing "no caveats" to allow **CC-BY attribution** (a clear, trivial
   condition) widens the pool — still verify assets each time.

---

### Sources
- [snes9x LICENSE (non-commercial)](https://github.com/snes9xgit/snes9x/blob/master/LICENSE)
- [Genesis Plus GX (non-commercial)](https://github.com/libretro/Genesis-Plus-GX)
- [libretro core licenses](https://docs.libretro.com/development/licenses/)
- [BlastEm (GPLv3) — libretro](https://docs.libretro.com/library/blastem/)
- [Beetle bsnes (GPLv3) — libretro](https://docs.libretro.com/library/beetle_bsnes/)
- [Mesen-S (GPLv3) — libretro](https://docs.libretro.com/library/mesen-s/)
- [mGBA (MPL-2.0)](https://mgba.io/faq.html)
- [PicoDrive → MAME license, non-commercial](https://github.com/notaz/picodrive/issues/41)
- [GPL FAQ — aggregation vs. derivative](https://www.gnu.org/licenses/gpl-faq.html)
- [Homebrew Hub](https://hh.gbdev.io/) · [OpenGameArt CC0 NES](https://opengameart.org/content/cc0-public-domain-nes) · [Zophar's PD ROMs (GB)](https://www.zophar.net/pdroms/gameboy.html)
- Verified titles: [openNES-Pong (zlib)](https://github.com/sebastiandine/openNES-Pong) · [Tobu Tobu Girl (MIT+CC-BY)](https://github.com/SimonLarsen/tobutobugirl) · [gbadev-org/games DB](https://github.com/gbadev-org/games) · [awesome-gbdev](https://github.com/gbdev/awesome-gbdev)
