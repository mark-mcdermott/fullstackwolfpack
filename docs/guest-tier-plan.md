# Guest tier — try-before-signup plan

**Goal:** let people play the arcade and work through built-in tutorials **without an account**, tracking progress in `localStorage`. Signup becomes a *"save your progress"* upgrade after they've felt the value — not a wall before it. AI features stay behind login (you can't store an encrypted API key without a user row), and managed/customized AI stays behind Pro.

## Tier model

| Tier | Gets | Enforced by |
|---|---|---|
| **Guest** (no login) | Arcade games · built-in tutorials · MCQ + code exercises · progress in `localStorage` | public routes + public read endpoints |
| **Free** (login) | All of the above, **synced to the account + cross-device**, plus **bring-your-own OpenAI/Claude key** (Akela tutor, AI grading, course generation on *your* key) | a key can't be stored without a user row — self-gating |
| **Pro** (pay) | Managed AI (platform key), adaptive tuning, unlimited topics | `core/access.ts` (already built) |

## What's already guest-ready (less work than expected)

- **`server/learning.ts getLessonView(lessonId)` takes no `userId`** — it loads lesson content, strips answer keys, and attaches code exercises. Already user-agnostic.
- **Built-in courses are `ownerUserId = null`** — not user-specific, safe to serve publicly.
- **The arcade page makes no server call** — it renders `EMBED_CATALOG` + the ROM list from client/static data. Only `RequireAuth` + playtime tracking tie it to a user.
- **Code exercises run 100% client-side** (`lib/run-exercise.ts`, `run-python.ts`, git-sim) — no server, so they already work for anyone.

So the content layer barely changes; the work is **progress, grading, un-gating, and the function cap.**

## The constraint that shapes everything: the 12-function Vercel cap

Vercel Hobby caps at **12 Serverless Functions**, and the app is at the limit — which is why every `/api/me/*` route folds into the single dynamic `api/me/[action].ts`. **Guest endpoints must NOT add a new function.** They fold into `[action].ts` as **pre-gate actions** — handled *before* the `getSessionUserId` check, exactly like `become` and `stripe-webhook` already are:

```ts
// top of GET/POST, before the session gate:
if (action(req) === 'public-lesson') return publicLesson(req)   // no auth
```

An allowlist of `public-*` actions runs unauthenticated; everything else keeps the session gate. Zero new functions.

## The build — 4 pieces

### 1. Un-gate the content routes
`RequireAuth` currently wraps all `/app/*` routes (`guards.tsx` → `Navigate to="/login"`). Two options:
- **A (recommended):** add **public routes** that reuse the same components — `/play` (arcade), `/learn/:topic`, `/learn/:topic/:lessonId` — outside the `RequireAuth` boundary. Logged-in users keep `/app/*`; guests get the public routes; the marketing site links to `/play` and `/learn/...`.
- **B:** relax `RequireAuth` to allow guests on specific `/app/*` routes. Simpler routing but muddies the "app = logged in" model.

Go with **A** — cleaner mental model, and the public URLs are SEO/shareable (the Astro site can deep-link into a lesson).

### 2. Public read endpoints (pre-gate actions in `[action].ts`)
- `public-course?topic=` → course outline **without progress** (a no-`userId` variant of `getCourseOutline`; progress comes from `localStorage`).
- `public-lesson?id=` → `getLessonView(lessonId)` (already user-agnostic — just expose it unauthenticated, restricted to `ownerUserId = null` built-ins).
- `public-grade` (POST) → grade an MCQ (server keeps the answer keys; grades **without logging** a `quiz_attempts` row). Short-answer/AI grading is **not** public — it needs a key.

Guard: all `public-*` actions only ever touch `ownerUserId = null` content, so a guest can never read someone's private course.

### 3. Guest progress store (`localStorage`)
A client module `lib/guest-progress.ts` mirroring the DB progress shape:
- completed lesson ids, per-topic XP, streak, last-active.
- `completeLessonGuest(lessonId, score)` computes XP/streak with the **same pure `core/` math** the server uses (reuse `core/learning.ts`), so guest and account progress are consistent.
- The player/dashboard read from it when `useAuth().user` is null; otherwise from the API.
- **This is the conversion hook, not a limitation:** device-local, losable progress → *"You've earned 340 XP — make a free account to save it."*

### 4. Signup migration
On `register()` (`auth-provider.tsx`), if guest progress exists in `localStorage`, POST it to a new **`me/import-progress`** action (authenticated, folds into `[action].ts`) that seeds the account's `xp_events` / progress, then clear `localStorage`. So a guest keeps everything they earned when they sign up.

## UX
- A slim **guest banner** ("Playing as a guest — sign up to save progress + unlock Akela").
- AI surfaces (Akela panel, AI grading, generation) show a **login prompt** instead of the Pro upsell when the user is a guest.
- Post-lesson completion for guests ends with a **"Save your progress →"** CTA.

## Phasing (ship incrementally)
1. **Arcade public** — smallest slice: un-gate `/play`, no progress needed. Instant "try it" value, proves the routing split.
2. **Tutorials public + guest progress + public-grade** — the core of the tier.
3. **Signup migration + nudges** — capture the conversion.

## Risks / non-goals
- **Answer-key exposure:** mitigated by the `public-grade` endpoint — keys stay server-side; the client never receives them (same as today's logged-in flow).
- **`localStorage` loss on cache clear:** acceptable / intended (it's the upgrade nudge).
- **Function cap:** never add a function — `public-*` + `import-progress` all fold into `[action].ts`.
- **Not in scope:** guest reviews/spaced-repetition, leaderboards, community (all inherently account-bound).
