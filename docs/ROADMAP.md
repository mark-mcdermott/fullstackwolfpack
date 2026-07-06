# Roadmap

Single view of what's shipped and what's left across the whole app. High-level
on purpose — the detailed learning/education plan lives in
[`education-system.md`](./education-system.md) (§7 "Phased plan") and the
data model in [`data-model.md`](./data-model.md). Deploy/setup steps live in the
root `CLAUDE.md` "Setup TODO". This file just ties them together and adds the
non-education tracks.

_Status: `[x]` shipped · `[~]` partial/stubbed · `[ ]` not started._

---

## Shipped

- `[x]` **Auth** — passkey/WebAuthn + TOTP fallback, session cookies, route guards (#1), and hardening: TOTP secret encrypted at rest, rate-limited `login`/`recover`, env-driven `requireUserVerification`, fail-closed prod config guard (#9).
- `[x]` **Shared core + api-client** — adapter seam, request validation (#2).
- `[x]` **Data model + seed** — 12 topics / 12 achievements / 20 levels; roles/tiers/permissions (#3).
- `[x]` **AI generation pipeline** — enroll → generate a course via the user's OpenAI key (encrypted); wired to Settings + Topics (#3, #7).
- `[x]` **Real-data app pages** — Dashboard/Topics/Progress/Stats/Achievements/Badges read live per-user data with honest empty states (#5). Badges are now **earned from live stats** — a pure `core/achievements.ts` engine derives each badge's status/progress (no award table), and the Badges page shows earned/in-progress/locked with per-badge art.
- `[x]` **Lesson player + learning loop** — segment-stepped player, inline MCQ grading, completion → score/XP/streak (#10).
- `[x]` **Spaced-repetition reviews** — SM-2 POC (#6) promoted to a wired review system (#11).
- `[x]` **Learn integration** — Topics/Dashboard/Sessions launch into the player; Sessions is a real "continue" hub; rate-limit row pruning (#12, #13).
- `[x]` **Arcade** — selectable ROM gallery + in-app emulator (#4) with remappable keyboard/gamepad controls (#8).
- `[x]` **FW-01 visual pass** — red accent theme, wolf mark + favicon, sidebar system-status + sign-out, wolf-sun art (landing / 404 / sign-in), and a **dark-mode toggle** (PR #15).
- `[x]` **UX punchlist round** (PR #58) — clickable sidebar brand, global pointer-cursor fix, gamepad radius + key-map label, topic-name deep links (Progress/Dashboard → Topics), longer generated courses (6–8 lessons), a **course-generation ETA progress bar** (with a `generation_timings` metrics table), and a **dark-mode toggle on the marketing site**.

---

## What's left

### Learning / education — see `education-system.md` §7
- `[x]` **Phase 3 — AI tutor + AI grading.** Grounded conversational tutor (`ai_tutor` Pro-gated, `components/learn/tutor-panel.tsx`) + free-text (`short_answer`) grading. Provider-agnostic seams (`core/{grader,tutor}` + `server/{grader,tutor,llm,provider}`): prefer a per-user Claude key → per-user OpenAI → env platform key; short-answer falls back to a pure keyword-overlap grade when no key is on file. Models per §5.5 (Haiku 4.5 grading, Sonnet 5 tutor).
- `[x]` **Phase 4 — in-browser code exercises.** CodeMirror 6 editor + a Web-Worker test runner (`core/exercise.ts` pure engine, `workers/exercise-worker.ts`, `lib/run-exercise.ts`, `components/learn/code-exercise.tsx`); wired into the player for `code`/`practice` segments. JS-first (TS transpile is a later add).
  - `[x]` **Generator emits real exercises.** The generator schema + prompt now emit an optional runnable `exercise` (`starterCode` + `{name,expression,expected}` tests + `solution` + `hint`) on `practice` segments — gated to JS-friendly topics so a Git/Docker course doesn't get a contrived JS task. Threaded through both write paths: `generated-to-seed.ts` (built-ins → `seed.ts`, already exercise-aware) and `server/course-store.ts` (live enroll → the `exercises` table). Malformed exercises are dropped (tolerant parse); `seed-content.test.ts` re-runs each built-in solution against its tests as a quality gate. **Left:** regenerate the built-in courses (`npm run gen:builtins`, needs a key) so shipped built-ins gain exercises — the code is ready, the current committed built-ins predate it.
  - `[ ]` **More languages + a terminal/git lane.** The runner is JS-only (`new Function` + value-assertion tests). Add TS execution (transpile), Python (Pyodide/WASM), and a terminal/git-style exercise (sandboxed shell or a scripted git simulator) — the big unlock for "learn git/CLI by doing."
- `[x]` **Adaptive difficulty** (education-system.md §5.4) — `core/adaptive.ts` (85% setpoint, Elo, mastery gate) + `server/adaptive.ts` + a `GET /api/me/adaptive` action; surfaced as a "try X next" nudge on the completion panel. No LLM, no new tables.

### Onboarding / course start
- `[x]` **Substantive generation + level pick** (branch `feat/course-depth-and-level-select`). Deepened `buildGenerationPrompt` (`core/generation.ts`) so lessons actually teach — no one-sentence "readings"; ~150–350-word segments with a concrete example, a pitfall, and runnable commented code — and added an optional **beginner / intermediate / advanced** selector on each Topics card that sets the cold-start difficulty the adaptive engine then tunes. The primary CTA is now a confident **"Start learning →"** instead of "Generate course →".
- `[~]` **Pregenerated built-in courses per topic** *(dive-in)* — machinery landed: `scripts/gen-builtins.ts` (`npm run gen:builtins [slug… | all]`) runs the improved generator over the topics lacking a built-in course and writes typed `SeedCourse`s to `db/seed-content.generated.ts` (spread into `BUILTIN_COURSES`; pure, tested mapper in `db/generated-to-seed.ts`). Generated all 10 remaining topics as 6-lesson beginner starters (readings carry a hook + concrete example + pitfall) at `ownerUserId = null`; once committed, every topic card is instant + key-free. Regenerate one topic with `npm run gen:builtins <slug>`, or everything with `all`.
  - `[ ]` *(optional polish)* Two minor nits from the current batch, neither blocking: **tailwind** generated 5 lessons (want 6); **nodejs** is light on quizzes (8 vs ~12). Regenerate just those two topics if desired.
- `[ ]` **Placement / prescreen quiz** *(optional — only if the level selector isn't enough)* — a few optional questions before generating to auto-set the starting difficulty (and skip already-known lessons). Deferred on purpose: it adds friction before the "make me a course" moment, and the adaptive engine already re-levels after ~4 answers. Revisit only if the coarse self-selected level proves too blunt.

### Monetization / tiers
- `[x]` **Stripe billing** (PR #59). Real Checkout + Billing Portal + a signature-verified webhook that flips `users.tier`; `checkout`/`billing-portal`/`stripe-webhook` fold into `api/me/[action].ts` (still 12/12 functions). Free/Pro gating (`core/access.ts`) already real. Dormant until the `STRIPE_*` env is set — see `CLAUDE.md` "Setup TODO".

### Focus-session runtime (the namesake feature)
- `[x]` **Timed play/learn sessions** — the focus timer, play/learn intervals, and focus score that "learn between gaming sessions" implies. Runtime (`core/focus-session.ts` plan/score + a Focus panel on **Sessions**); completed sessions record to `sessions` with `focusMode` and **grant rewards** — session XP, a `daily_activity` learn-minutes contribution, and a streak advance — via the shared `server/rewards.ts` (also used by lesson completion). Feeds hours, the minutes-learned trend, streaks, and the Focus-Mode badge. Enhancements left:
  - `[x]` **Custom play/learn lengths** — a free number input on Sessions for arbitrary play/learn minutes, alongside the 15/25/45 · 5/10/15 presets (clamped to the `normalizeFocusConfig` bounds).
  - `[x]` **Global persistent timer** — the focus timer now lives in an app-level `TimerProvider` (not the Sessions page), so it keeps running across navigation and page reloads. Wall-clock anchored (survives reload/backgrounded tabs) and mirrored to localStorage; surfaced as a floating dock (top-right) on every in-app page with a "Play now" jump to the Arcade. `hooks/timer-{context,provider}`, `components/focus/focus-timer-dock.tsx`.
  - `[~]` Launch a real lesson during the Learn phase — the timer's "Learn now" button deep-links to Topics today; deep-linking straight into the next unfinished lesson's player is the remaining step.

### Arcade
- `[x]` **HTML5 embed lane** (self-hosted web games). A second game type alongside the ROM emulator: verified 🟢 Green-bucket HTML5 games play in a sandboxed iframe (`components/embed-player.tsx`), driven by `lib/embed-catalog.ts` + a default-deny `public/games/.gitignore`. Games: **2048** (MIT) + **Hextris** (GPL-3, ads/trackers stripped) + **HexGL** (MIT + PD/CC-BY audio, GA stripped — the showpiece WebGL racer). A per-game **Credits page** (`/app/credits`) + a **CI license guard** (`embed-catalog.test.ts`) keep attributions from ever going missing. Higher quality than homebrew ROMs *and* touch-native (works on mobile). See `docs/arcade-content.md`.
- `[x]` **Persistent user ROM uploads** — uploaded ROMs save to IndexedDB (client-only, never sent to a server) so they survive Exit and reload; the gallery lists stored ROMs with a remove action. `lib/rom-library.ts`, `hooks/use-rom-library.ts`. (Previously an upload lived only in React state and vanished on Exit.)
- `[ ]` **Harden the embed sandbox** — serve `public/games/` from a separate origin so the iframe can drop `allow-same-origin` (full cross-frame isolation for third-party game code).
- `[x]` **Bundle more green-lit games (embed lane).** Shipped four, taking the embed catalog to **7**: **Underrun** (MIT), **Astray** (Unlicense — absolute texture paths made relative), **Hauberk** (MIT — prebuilt gh-pages app, Google-Fonts `<link>` stripped), and **Chess** (assembled: chessboard.js MIT + chess.js BSD-2 + jQuery MIT + Cburnett piece art BSD-3). Each vendored under `public/games/<slug>/` with its verbatim LICENSE, whitelisted in the default-deny `.gitignore`, and added to `lib/embed-catalog.ts` (+ Credits + the license-guard test, all green). Deferred (need build toolchains, not drop-in): **cube-composer** (PureScript/pulp/bower + strip 3 externals) and **Freedoom** (Emscripten build + GPL engine caveat).
- `[ ]` **Netflix-style cover-art gallery** *(optional, settings-gated).* A richer poster-grid Arcade. Cover art is the crux: start with user-uploaded covers (store a cover blob per ROM alongside the new IndexedDB library) and/or bundled art for catalog/embed titles; auto-generated art is a later stretch.
- `[~]` **In-game telemetry (playtime + score).** **Playtime shipped.** Server-side `game_playtime` table (one row per user+game, cumulative seconds) + `GET/POST /api/me/playtime` folded into `[action].ts` (12/12 held); pure `core/playtime.ts` (key/format/schemas) + `server/playtime.ts` (incrementing upsert). A `usePlaytimeTracker` flush hook (wall-clock deltas, flushed on a 60s interval + tab-hide `sendBeacon` + unmount, hidden time excluded) is wired into **both** the ROM and embed players; the gallery shows "42m played" per tile and floats recently-played titles to the front of each lane. Syncs across devices; can feed Stats. Needs `npm run db:push` for the new table. **Left:** live score/progress is hard — per-game RAM-address maps (cheat-engine style) or RetroAchievements-style core integration; SRAM / save-state persistence is the tractable middle step.
- `[x]` **Mobile touch controls (virtual gamepad).** Shipped. `components/controls/touch-controls.tsx` overlays the ROM player on coarse-pointer devices (`useCoarsePointer`): a diagonal-capable D-pad plus the system's face/shoulder/system buttons (`touchButtonsForSystem` — two face buttons for NES/GB, the four-button diamond + L/R for SNES/Genesis). Input goes straight to the emulator via new `pressDown`/`pressUp` methods on the `EmulatorSession` seam (Nostalgist's programmatic RetroPad press — no synthetic key events). Multi-touch (a direction + a face button together) works via per-control pointer capture; a held button releases on unmount so a lesson interrupt can't leave input stuck. Pure `dpadDirections` + `touchButtonsForSystem` are unit-tested. Unblocks a usable mobile arcade / Capacitor. (The embed lane already worked on touch.)

### Native / desktop shells
> Shared unlock: both shells bundle the static `dist`, but the backend is serverless `/api/*` and auth is WebAuthn RP-bound — so the shells must point at the **deployed prod backend** (Capacitor `server.url` / a Tauri fetch base + RP-origin allowances) to work beyond static rendering. Prod exists (arcade is live), so this is now unblocked.
- `[~]` **Tauri** (desktop, Win/Mac) — *closer.* Config landed: real bundle id (`com.fullstackwolfpack.app`, matches Capacitor), `productName`/window sizing/`Cargo.toml` metadata, **icons regenerated from the wolf mark** (white mark on the FW-dark square; `tauri icon`), and a **prod-API seam** — the api-client composition root reads `VITE_API_BASE`, so a packaged shell points every `/api/*` call at the deployed origin (empty = the same-origin web default). Remaining: set `VITE_API_BASE` to the real prod URL at build time, run `tauri build` (first-run Rust compile), then code-sign/notarize to distribute. An unsigned dev build works now.
- `[~]` **Capacitor** (iOS/Android) — *scaffolded + building.* Native projects generated under `apps/web/{ios,android}` (`@capacitor/ios`/`@capacitor/android` 8.4.1) and **both verified to compile** — Android `./gradlew assembleDebug` (debug APK) and an iOS simulator `xcodebuild` (BUILD SUCCEEDED). Capacitor 8 uses **Swift Package Manager** for iOS, so there is **no CocoaPods/Podfile**. `capacitor.config.ts` is wired for the RP-origin constraint: a prod build sets **`CAP_SERVER_URL`** and the config points the whole webview at the deployed origin (`server.url` + `androidScheme: https`) so passkeys work — empty in dev loads the bundled `dist`. `npm run cap:sync` (root or `-w @fw/web`) builds then syncs; Capacitor's nested `.gitignore`s keep build artifacts / `local.properties` / copied web assets out of git. Its prerequisite — the **virtual gamepad** touch-controls — already shipped. **Remaining loose ends:**
  - **`CAP_SERVER_URL`** — set to the real prod origin at build time (webview origin must match the WebAuthn RP or passkeys fail on `capacitor://localhost`).
  - **Signing + store accounts** — Apple Developer team (+ associated-domains entitlement) and Google Play Console; then `cap open ios`/`open android` → archive/upload.
  - **WebAuthn-in-WKWebView** needs **iOS 16+** + associated-domains for platform passkeys.
  - **Local Android CLI builds** need `ANDROID_HOME=~/Library/Android/sdk` and a JDK on `JAVA_HOME` (Android Studio's bundled JBR at `/Applications/Android Studio.app/Contents/jbr/Contents/Home` works); iOS just needs Xcode.

### Community / social *(new track — not started)*
- `[ ]` **Global leaderboards** — an opt-in public ranking off the existing XP/stats; fold the API into `api/me/[action].ts` (mind the 12/12 function cap). Lowest-effort community feature and a good first step.
- `[ ]` **Chat / learning-with-friends** — friends, presence, messaging. Needs realtime infra (WebSockets / a hosted realtime service) the app doesn't have yet.
- `[ ]` **Multiplayer / netplay** — 2-player games over the net. Significant: libretro netplay or per-game rollback is hard — a long-horizon stretch after leaderboards + chat.

### Deploy / infra — see root `CLAUDE.md` "Setup TODO"
- `[ ]` **Neon prod DB** — create project, set `DATABASE_URL` (+ in Vercel), `npm run db:push`.
- `[ ]` **Per-env secrets** — `RP_ID` / `RP_ORIGIN` / `AUTH_SECRET` / `ENCRYPTION_KEY`. Production **refuses to start** on dev defaults (by design).
- `[ ]` **Vercel** — link the project (`@vercel/analytics` only reports once deployed).

### Loose ends
- `[x]` **Real seed course content** (PR #18). A shared built-in "Git & GitHub" course (`ownerUserId = null`, fixed ids → idempotent seed) so new users can Start Learning immediately — no OpenAI key needed. Add more in `src/db/seed-content.ts`.
- `[x]` **Real time-series charts** (PR #16). Live XP-over-time on Progress and accuracy + minutes trends on Stats, fed from `xp_events` / `quiz_attempts` / `daily_activity` via `getSeries` + the pure `core/series` bucketing. `src/components/charts.tsx` exports two tiny dependency-free primitives — `Sparkline` (SVG line) and `Bars` (CSS bars), each taking a `number[]`.
- `[~]` **Deeper per-page mock parity.** The FW-01 visual pass (PR #15) covered the theme, chrome (sidebar / logo / favicon / dark toggle), and the landing / 404 / sign-in art; the **dashboard hero** now carries the wolf-sun (PR #20). Remaining: richer stat panels and the footer "system feed" can move closer to the mocks incrementally.
- `[x]` **Theme toggle on mobile app views** (PR #17) — added to the app header, shown on mobile only (desktop keeps the sidebar toggle).
- `[ ]` **Badge art restyle** — the live-derived badges carry per-badge art today; a cohesive VGA / Super-VGA pixel-art set would sharpen the retro identity. Pure design/asset swap over the existing `core/achievements.ts` badge list + Badges page.
- `[~]` **`auth_rate_limits` housekeeping.** Opportunistic prune of stale rows is in (#12); a scheduled/TTL sweep is a possible future refinement (no cron today — see the function cap below).
- `[~]` **Admin + blog** (admin: PR #19). The admin Users page now lists real users and persists role/tier via an admin-gated `admin-users` action (folded into `[action].ts`; server-side `can(user, 'admin.access')` gate). The public blog is still a thin stub — no CMS yet.
- `[x]` **Short-answer accuracy in stats.** AI grading (Phase 3) records each short-answer as a `quiz_attempts` row (`isCorrect` + `aiFeedback`), so it folds into the existing accuracy metrics automatically.

---

## Constraints & coordination

- **Vercel Hobby caps at 12 Serverless Functions/deployment.** We're at **12/12**. Every file in `api/` is one function — **new API routes must fold into `api/me/[action].ts`** (dispatch by path segment + method), never as new files. See the `[action].ts` header.
- **Parallel panes** (keep tracks separated to avoid conflicts):
  - _Education pane_ — the learning phases above (`core/learning`, `core/review*`, `server/learning`, `server/review`, `pages/app/{learn,review}.tsx`).
  - _Arcade pane_ — `pages/app/arcade.tsx`, `components/rom-*`, `lib/{emulator,controls-store}.ts`, `core/roms.ts`.
  - _Core/data pane_ — data layer, auth, AI-generation seam, app-page wiring, infra.
  - Shared touch-points that tend to conflict (resolve additively — keep both): `api/me/[action].ts`, `src/api-client/api.ts`, `src/App.tsx`, `src/components/layout/sidebar.tsx`.
- **Source docs:** `CLAUDE.md` (architecture + Setup TODO), `docs/education-system.md` (learning design + phases), `docs/data-model.md` (schema).
