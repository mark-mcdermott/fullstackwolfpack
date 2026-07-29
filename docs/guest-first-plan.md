# Guest-first plan — make the app kickass for logged-out users

**Goal:** a logged-out visitor lands *in the app* and can run the whole core loop
for free — no marketing bounce, no login wall. Login becomes a "save / sync /
friends" invitation, not a gate. Refine monetization later.

## Current state
- Guests already have a hidden side-lane: `/play` (arcade) + `/learn` (tutorials)
  with localStorage progress (guest-tier, PRs #104–106).
- But the **real app** (`/app/*` — launcher, the seamless game↔lesson loop,
  sessions, topics, friends) is 100% behind `RequireAuth`, and `/` redirects
  logged-out users out to the marketing site. So guests never reach the good part.
- `api.public.topics/course/lesson/grade` already exist — the content surface is
  built; the gaps are routing + a few authed calls in the launcher/overlay.

## What's open to guests vs gated
- **Open:** the core loop (launcher → play → lesson → back), arcade, tutorials,
  **leaderboard (view-only)**.
- **Gated (soft login prompt):** friends, settings, **AI tutor (Akela)**, AI
  short-answer grading, cross-device sync, appearing *on* the leaderboard,
  saving progress to an account.

## The content works AI-free at play time
The AI is only two OPTIONAL runtime features — the Akela chat and short-answer
*grading*. The built-in courses themselves need no AI to learn from:
- readings + glossaries (static),
- MCQ quizzes (graded instantly by `correctIndex`, no AI),
- code exercises (run 100% client-side, no AI).
So a guest gets a complete loop: read → code → multiple-choice → score → XP.
Goal: polish **a couple built-in topics** to be genuinely excellent, leaning on
MCQs + code exercises (avoid AI-graded short-answer, which needs login).

## Phases

### Phase 1 — front door + guest core loop (the big one)
- `/` for logged-out → land on a **guest home = the launcher** (not a redirect).
- Make `SessionLauncher` guest-aware: use `api.public.topics()` instead of
  `api.data.topics()`; skip `setDifficulty` (guests have no track); route the
  session to the guest arcade (`/play?game=`) instead of `/app/arcade`.
- Make `FocusLessonOverlay` guest-aware: use `api.public.course()` + pass the
  `guest` flag to `LessonRoute` so the in-game lesson uses public endpoints +
  localStorage completion.
- Result: a guest picks a game + topic, plays, gets the real lesson at the
  interval, banks XP locally — the whole loop, no account.

### Phase 2 — stop the marketing bounce (decouple, don't delete)
- The app becomes self-sufficient: `/` no longer redirects to the marketing
  site; sign-out returns to the in-app guest home. Marketing site stays at `www`
  but the app no longer depends on it. Reversible (`SITE_URL` still used for
  explicit marketing links).

### Phase 3 — leaderboard for guests (view-only) + "you made the board" hook
- `public-leaderboard` pre-gate action (like the other `public-*` reads) → the
  ranking with no "isMe". Guests see it + a "sign up to join the ranking" CTA.
- **Conversion hook:** a guest's XP is in localStorage, so they aren't *on* the
  real board — but compare their guest XP to the board's cutoff. If it *would*
  rank them, show a **"You made the leaderboard! Claim your username"** modal →
  save the chosen username to localStorage → **prefill the signup username
  field** from it later. Turns "you earned a spot" into the signup moment.

### Phase 4 — Akela for guests (cost-guarded)
- A public tutor path that uses the **platform** provider key (guests have none
  of their own). Dormant-until-keyed: shows for guests only if `ANTHROPIC_API_KEY`
  / `OPENAI_API_KEY` is set in env; otherwise a soft "sign in for Akela." Add
  rate-limiting (per-IP / low cap) so anonymous traffic can't run up the bill.

### Non-goals (stay gated)
Friends, DMs, settings, billing, appearing on the leaderboard, account-synced
progress — all behind a gentle, non-blocking login prompt.

## Persistent nudge
A slim, dismissible "playing as a guest — sign up to save your progress + play
with friends" strip (already exists in `GuestLayout`), never a modal wall.
