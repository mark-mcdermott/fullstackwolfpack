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
- `[x]` **Real-data app pages** — Dashboard/Topics/Progress/Stats/Achievements/Badges read live per-user data with honest empty states (#5).
- `[x]` **Lesson player + learning loop** — segment-stepped player, inline MCQ grading, completion → score/XP/streak (#10).
- `[x]` **Spaced-repetition reviews** — SM-2 POC (#6) promoted to a wired review system (#11).
- `[x]` **Learn integration** — Topics/Dashboard/Sessions launch into the player; Sessions is a real "continue" hub; rate-limit row pruning (#12, #13).
- `[x]` **Arcade** — selectable ROM gallery + in-app emulator (#4) with remappable keyboard/gamepad controls (#8).
- `[x]` **FW-01 visual pass** — red accent theme, wolf mark + favicon, sidebar system-status + sign-out, wolf-sun art (landing / 404 / sign-in), and a **dark-mode toggle** (PR #15).

---

## What's left

### Learning / education — see `education-system.md` §7
- `[ ]` **Phase 3 — AI tutor + AI grading.** Conversational tutor (`ai_tutor` Pro feature) + free-text (`short_answer`) grading. Today `submitAnswer` only grades MCQ; short-answer returns a zero-XP stub.
- `[ ]` **Phase 4 — in-browser code exercises.** CodeMirror 6 + a Web-Worker test runner (JS/TS first).
- `[ ]` **Adaptive difficulty** (education-system.md §5.4) — lightweight, net new.

### Monetization / tiers
- `[~]` **Stripe billing.** `subscriptions` table, Pricing page, and the Settings billing panel exist as **schema/UI stubs** — no payment provider wired. Free/Pro tier gating (`core/access.ts`) is real; the checkout/webhook path is not.

### Focus-session runtime (the namesake feature)
- `[ ]` **Timed play/learn sessions** — the focus timer, play/learn intervals, and focus score that "learn between gaming sessions" implies. The **Sessions** page is now a real launcher (resume/start a lesson); the *timed session runtime* itself is unbuilt and slots into that page.

### Native / desktop shells
- `[ ]` **Capacitor** (iOS/Android) — not initialized (`npx cap add …`; needs Xcode / Android Studio).
- `[ ]` **Tauri** (desktop) — not initialized (`npm run tauri dev`; replace placeholder icons).

### Deploy / infra — see root `CLAUDE.md` "Setup TODO"
- `[ ]` **Neon prod DB** — create project, set `DATABASE_URL` (+ in Vercel), `npm run db:push`.
- `[ ]` **Per-env secrets** — `RP_ID` / `RP_ORIGIN` / `AUTH_SECRET` / `ENCRYPTION_KEY`. Production **refuses to start** on dev defaults (by design).
- `[ ]` **Vercel** — link the project (`@vercel/analytics` only reports once deployed).

### Loose ends
- `[ ]` **Real seed course content.** `topics`/`achievements`/`levels` are seeded, but `courses`/`lessons` only exist once generated per-user. Consider a small built-in course so new users see content pre-generation.
- `[x]` **Real time-series charts** (PR #16). Live XP-over-time on Progress and accuracy + minutes trends on Stats, fed from `xp_events` / `quiz_attempts` / `daily_activity` via `getSeries` + the pure `core/series` bucketing. `src/components/charts.tsx` exports two tiny dependency-free primitives — `Sparkline` (SVG line) and `Bars` (CSS bars), each taking a `number[]`. They originally rendered **hardcoded/fake** data on the dashboards; that fake data was removed in #5, leaving the components **unused but intentionally retained** (they're generic and reusable). The task: feed them **real** series from `daily_activity` / `xp_events` history (XP over time, weekly activity, accuracy trend) once that history accrues — not delete them.
- `[~]` **Deeper per-page mock parity.** The FW-01 visual pass (PR #15) covered the theme, chrome (sidebar / logo / favicon / dark toggle), and the landing / 404 / sign-in art. Individual app screens (dashboard hero art, richer stat panels, the footer "system feed") can move closer to the mocks incrementally.
- `[x]` **Theme toggle on mobile app views** (PR #17) — added to the app header, shown on mobile only (desktop keeps the sidebar toggle).
- `[~]` **`auth_rate_limits` housekeeping.** Opportunistic prune of stale rows is in (#12); a scheduled/TTL sweep is a possible future refinement (no cron today — see the function cap below).
- `[ ]` **Admin + blog.** `pages/admin/users.tsx` and the public blog are thin; no real admin actions / CMS.
- `[ ]` **Short-answer accuracy in stats.** Once AI grading lands (Phase 3), fold short-answer results into the accuracy metrics.

---

## Constraints & coordination

- **Vercel Hobby caps at 12 Serverless Functions/deployment.** We're at **12/12**. Every file in `api/` is one function — **new API routes must fold into `api/me/[action].ts`** (dispatch by path segment + method), never as new files. See the `[action].ts` header.
- **Parallel panes** (keep tracks separated to avoid conflicts):
  - _Education pane_ — the learning phases above (`core/learning`, `core/review*`, `server/learning`, `server/review`, `pages/app/{learn,review}.tsx`).
  - _Arcade pane_ — `pages/app/arcade.tsx`, `components/rom-*`, `lib/{emulator,controls-store}.ts`, `core/roms.ts`.
  - _Core/data pane_ — data layer, auth, AI-generation seam, app-page wiring, infra.
  - Shared touch-points that tend to conflict (resolve additively — keep both): `api/me/[action].ts`, `src/api-client/api.ts`, `src/App.tsx`, `src/components/layout/sidebar.tsx`.
- **Source docs:** `CLAUDE.md` (architecture + Setup TODO), `docs/education-system.md` (learning design + phases), `docs/data-model.md` (schema).
