# Landing page redesign — build brief

**Goal:** rebuild the logged-out marketing landing page to match the mock at
**~95% fidelity**. Omit only the messy "scribbly AI-ism" details (see Omit list).
Everything structural, typographic, and chromatic should match the mock closely.

## Source of truth
- **Mock:** `/Users/stuxxnet/Dev/fullstack-wolfpack-proj/mocks/landing-page.png`
  — **Read this image first**, every session, before building. (Full mock set
  for other screens lives in that same `mocks/` folder.)
- **File to rebuild:** `apps/site/src/pages/index.astro` (currently a simplified
  ~90-line version). Layout chrome (header/footer) is `apps/site/src/layouts/Base.astro`.
- This is the **Astro** marketing site (`@fw/site`, static SSG). Light theme by
  default (sections alternate light/dark exactly as the mock does).

## Process (use the `frontend-design` skill)
1. **Invoke the `frontend-design` skill** — but the mock is the *pinned direction*,
   so follow it exactly; the skill's job here is execution craft + quality floor,
   not a new look.
2. Read the mock image. Build section-by-section top→bottom.
3. **Quality floor:** responsive (mock is desktop — stack sensibly on mobile,
   320→1440), visible keyboard focus, `prefers-reduced-motion` respected.
4. **Self-critique:** after building, compare against the mock section by section;
   fix spacing/type/color drift. Build the app (`npm run build -w @fw/site`) green.

## Assets & system (already in the repo)
- **Display font:** Placa (Adobe Fonts, weight 600) via `--font-heading` — used on
  all the big uppercase headings. Typekit kit already in `Base.astro` head.
- **Wolf + red-sun hero art:** `apps/site/public/images/wolf-sun-transparent.png`
  (also `wolf-rear-and-sun.png`). *Note:* confirm it matches the mock's detailed
  ink-wolf + red circle; if the transparent asset differs, flag it — we may need
  the exact hero art exported.
- **Wolf mark (nav/footer logo):** inline `currentColor` SVG — copy the markup
  from `packages/ui/src/ui-kit.tsx` `WolfMark` (Astro can't import the React one;
  Base.astro already inlines it in the header).
- **Theme tokens** (`@fw/ui/theme.css`, imported by the site): `--primary` (FW-01
  red), `--foreground`, `--background`, `--muted-foreground`, `--border`,
  mono font, etc. Use tokens, not hardcoded hex.
- **FW-01 detail language** (present throughout the mock): mono `// EYEBROW`
  labels, corner `+` marks at section corners, **bracket corners** on panels,
  **barcode** strips, coordinates (`35.6895° N, 139.6917° E`), the `FW-01` badge,
  `v1.0.0`, red **hazard stripes** (`/////`) bottom-right of sections.

## Section-by-section spec (top → bottom)

1. **Top nav** (light, in `Base.astro` or the page): wolf mark + `FULLSTACK
   WOLFPACK` / `ウルフパック` · links `HOW IT WORKS · FEATURES · PRICING · ABOUT`
   · a **SYSTEM STATUS / ONLINE** mini-panel with a barcode · red **START LEARNING**
   button with a clipped/notched corner. (The current Base header is minimal —
   expand it to match, but keep it shared.)
2. **Hero** (light): eyebrow `// AI-POWERED LEARNING PLATFORM`; H1 **`LEARN.` /
   `PLAY.` / `LEVEL UP.`** stacked, `LEVEL UP.` in red (Placa, huge). Subcopy
   `TURN SCREEN TIME` / `INTO REAL WORLD SKILLS.` (mono). Buttons: **START SESSION**
   (red, notched) + **VIEW DASHBOARD** (outline). Footline `30 MIN PLAY // 10 MIN
   LEARN`. Right column: the **wolf + red-sun** art with FW-01 chrome around it
   (`FW-01` badge, `v1.0.0`, coordinates, a clean scroll indicator, a dot grid,
   `+` crosshairs). Corner `+` marks frame the hero.
3. **Stats bar** (light, bracketed panel): 4 stats with red icons + numbers —
   `7 DAY STREAK` (flame) · `82% AVG QUIZ ACCURACY / LAST 7 DAYS` (target) ·
   `124 HOURS LEARNED / ALL TIME` (book) · `301 HOURS PLAYED / ALL TIME` (gamepad).
   Thin vertical dividers between.
4. **How it works** (**dark** section): eyebrow `// HOW IT WORKS`; H2 `LEARN IN
   INTERVALS.` / `RETAIN FOREVER.`; a 4-step row with icons + arrows between:
   `01 YOU PLAY` (gamepad) → `02 WE PAUSE` (bell) → `03 YOU LEARN` (book) →
   `04 YOU LEVEL UP` (target); red step numbers; short mono descriptions. Corner
   `+` marks; red hazard stripes bottom-right. *(Numbered 01–04 is legit here —
   it's a real sequence.)*
5. **Features** (light): eyebrow `// FEATURES`; H2 `BUILT FOR GAMERS.` /
   `DESIGNED FOR GROWTH.`; 4 **bracket-cornered cards**, each icon + title + desc +
   a top-right `+`: `AI CURATED LESSONS` (chip) · `MULTI-PLATFORM` (bars) ·
   `DETAILED PROGRESS` (line chart) · `BUILT TO MOTIVATE` (people).
6. **Why it works** (light): eyebrow `// WHY IT WORKS`; H2 `SHORT BURSTS.` /
   `LASTING IMPACT.`; left = paragraph + red `LEARN MORE →`; right = 3 **big red
   stats** with labels + sources, vertical dividers: `2.4x HIGHER RETENTION` ·
   `45% MORE CONSISTENT` · `98% USER SATISFACTION`.
7. **CTA band** (**solid red**): eyebrow `// READY TO LEVEL UP?`; H2 `YOUR NEXT
   LEVEL` / `STARTS NOW.` (white); white **START YOUR SESSION** button. Hazard
   stripes bottom-right.
8. **Footer** (**dark**): wolf mark + `ウルフパック` + tagline `Fullstack Wolfpack
   helps gamers level up in game and in life.`; 3 link columns `PLATFORM /
   RESOURCES / COMPANY`; a bordered **`> STAY FOCUSED / > KEEP LEARNING / > KEEP
   LEVELING UP`** panel with a barcode; social icons (discord/x/youtube/github);
   `© 2025 FULLSTACK WOLFPACK · ALL RIGHTS RESERVED`; a `⊕ EN ▾` lang selector.

## Omit (the "scribbly AI-isms" — do NOT reproduce)
- The messy hand-drawn scratch/scribble marks and ink-splatter flecks scattered
  around the hero and sections.
- Any illegible "sketchy" doodles. Keep the wolf art itself **clean**.
- Over-busy micro-scratches. Keep FW-01 chrome **crisp and intentional** (clean
  `+` marks, brackets, barcodes, coordinates) — those stay; the *scribbles* go.

## Links / behavior
- Primary CTAs (`START SESSION`, `START LEARNING`, `VIEW DASHBOARD`, `START YOUR
  SESSION`) → `/app`. Nav links → their pages (or `#` anchors for now:
  `#how-it-works`, `#features`). Footer links → existing routes where they exist
  (Blog → `/blog`), else `#`.

## Definition of done
- Section order, copy, layout, color, and type match the mock ~95% at desktop;
  responsive + accessible; `npm run build -w @fw/site` green; self-critiqued
  against the mock image. Commit per section or in a couple of coherent commits.
