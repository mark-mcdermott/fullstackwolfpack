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
- `[x]` **Adaptive difficulty** (education-system.md §5.4) — `core/adaptive.ts` (85% setpoint, Elo, mastery gate) + `server/adaptive.ts` + a `GET /api/me/adaptive` action; surfaced as a "try X next" nudge on the completion panel. No LLM, no new tables.

### Monetization / tiers
- `[x]` **Stripe billing** (PR #59). Real Checkout + Billing Portal + a signature-verified webhook that flips `users.tier`; `checkout`/`billing-portal`/`stripe-webhook` fold into `api/me/[action].ts` (still 12/12 functions). Free/Pro gating (`core/access.ts`) already real. Dormant until the `STRIPE_*` env is set — see `CLAUDE.md` "Setup TODO".

### Focus-session runtime (the namesake feature)
- `[x]` **Timed play/learn sessions** — the focus timer, play/learn intervals, and focus score that "learn between gaming sessions" implies. Runtime (`core/focus-session.ts` plan/score + a Focus panel on **Sessions**); completed sessions record to `sessions` with `focusMode` and **grant rewards** — session XP, a `daily_activity` learn-minutes contribution, and a streak advance — via the shared `server/rewards.ts` (also used by lesson completion). Feeds hours, the minutes-learned trend, streaks, and the Focus-Mode badge. Enhancements left:
  - `[ ]` **Custom play/learn lengths** — a free number input on Sessions for arbitrary play/learn minutes, alongside the 15/25/45 · 5/10/15 presets (clamp to the `normalizeFocusConfig` bounds).
  - `[ ]` Launch a real lesson during the Learn phase (deep-link into the player).

### Arcade
- `[ ]` **Mobile touch controls (virtual gamepad).** On a phone the emulator has no way to send inputs — a bundled ROM that says "Press Start" is unplayable because there are no on-screen buttons (confirmed in prod on iOS). Add a touch overlay to the Arcade player: an on-screen D-pad + A/B + Start/Select mapping to the existing RetroPad inputs, shown on touch/coarse-pointer devices. Reuse the button set already defined for the controls remapper (`RETROPAD_BUTTONS`).
- `[ ]` **Better bundled games.** The 4 legally-clear homebrew ROMs are weak; evaluating non-ROM lanes (self-hosted open-source HTML5 games, interactive fiction, DOS/ScummVM freeware) that fit a new embed lane in the arcade. Legal bar unchanged: Green-bucket only (CC0/MIT/BSD/zlib/Apache/CC-BY), **code + assets both verified** (see `docs/rom-licensing.md`).

### Native / desktop shells
- `[ ]` **Capacitor** (iOS/Android) — not initialized (`npx cap add …`; needs Xcode / Android Studio).
- `[ ]` **Tauri** (desktop) — not initialized (`npm run tauri dev`; replace placeholder icons).

### Deploy / infra — see root `CLAUDE.md` "Setup TODO"
- `[ ]` **Neon prod DB** — create project, set `DATABASE_URL` (+ in Vercel), `npm run db:push`.
- `[ ]` **Per-env secrets** — `RP_ID` / `RP_ORIGIN` / `AUTH_SECRET` / `ENCRYPTION_KEY`. Production **refuses to start** on dev defaults (by design).
- `[ ]` **Vercel** — link the project (`@vercel/analytics` only reports once deployed).

### Loose ends
- `[x]` **Real seed course content** (PR #18). A shared built-in "Git & GitHub" course (`ownerUserId = null`, fixed ids → idempotent seed) so new users can Start Learning immediately — no OpenAI key needed. Add more in `src/db/seed-content.ts`.
- `[x]` **Real time-series charts** (PR #16). Live XP-over-time on Progress and accuracy + minutes trends on Stats, fed from `xp_events` / `quiz_attempts` / `daily_activity` via `getSeries` + the pure `core/series` bucketing. `src/components/charts.tsx` exports two tiny dependency-free primitives — `Sparkline` (SVG line) and `Bars` (CSS bars), each taking a `number[]`.
- `[~]` **Deeper per-page mock parity.** The FW-01 visual pass (PR #15) covered the theme, chrome (sidebar / logo / favicon / dark toggle), and the landing / 404 / sign-in art; the **dashboard hero** now carries the wolf-sun (PR #20). Remaining: richer stat panels and the footer "system feed" can move closer to the mocks incrementally.
- `[x]` **Theme toggle on mobile app views** (PR #17) — added to the app header, shown on mobile only (desktop keeps the sidebar toggle).
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
