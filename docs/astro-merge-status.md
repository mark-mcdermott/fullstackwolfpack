# Astro-merge migration — status & hand-off

Executing `docs/astro-merge-plan.md`. **One Astro app now serves everything** —
static pages + the React `client:only` applet + `/api/*` Astro endpoints — on a
single origin, one Vercel function. Runs on `main` (each phase committed green).

## Landed (Phases 1–4 core)

| Phase | What | Verified |
|---|---|---|
| 1 | `@astrojs/react` (4.x, Astro-5 compatible) added to `apps/site`; React island renders | `astro build` |
| 2 | `apps/web/src` → `apps/site/src/app` (`@`→`src/app`, zero import rewrites); `AppRoot.tsx` mounted as `client:only` catch-all (`src/pages/[...slug].astro`) + `@astrojs/vercel` adapter; public game/rom/cover assets moved to `apps/site/public` | `astro build` + `astro dev` deep-link probes (`/app/*` served, `/`,`/about` stay static) |
| 3 | `apps/web/api` → `apps/site/src/pages/api` as Astro `APIRoute`s (`prerender=false`); `src/*`→`@/` imports; `_lib` kept relative + unrouted; astro.config loads `.env` into `process.env` | **12 functions → 1** (`_render.func`); `astro dev`: gated routes 401, logout 200, `public-topics` 200 with live Neon data |
| 4 | `APP_URL`→`''` (same-origin CTAs); deleted obsolete password auth mockups (real passkey auth is the applet's `/login`,`/signup`); guest launcher relocated to `/start` (Decision 2) | `astro build` |

Throughout: **483/483 unit tests green** (run `npm test`). Decisions locked:
apex is the single origin (Decision 1); `/` is the static landing, launcher in the
applet (Decision 2); API as Astro endpoints (Decision 3); folded into one app
(Decision 4 — `packages/core` proved unnecessary since the `@/` alias serves the
single codebase).

## Deferred polish (optional; interactive versions already work via the applet)

- **Static Learn/Arcade catalogs + light user-state islands** — the plan's SEO/paint
  optimization. The interactive React versions already work at `/learn`, `/play`
  (applet). Rebuild as `.astro` static catalogs + `client:load` islands when SEO
  matters.
- **Shared-chrome `UserMenu` nanostore island** — reflect login state in the static
  header (`fetch /api/auth/me` once via `nanostores`). Header currently shows only
  the "Start Learning" CTA; auth state is handled inside the applet.

## Phase 5 — done

1. ✅ **Vercel project** — `fullstackwolfpack-astro`, Root Directory `apps/site`,
   apex `fullstackwolfpack.com` as production with `www` 308-redirecting to it.
2. ✅ **Env vars** — `DATABASE_URL` (Production only, so previews can't write prod),
   `AUTH_SECRET`, `ENCRYPTION_KEY` (both rotated — the originals were Sensitive and
   unreadable), `RP_ID`/`RP_ORIGIN` = apex, `STRIPE_*`, AI keys, `ABLY_API_KEY`.
3. ✅ **Local passkey E2E** — register + login verified against `localhost:4321`.
4. ✅ **`apps/web` deleted** — native shells relocated to `apps/site`, all root
   scripts (`db:*`, `lint`, `tauri`, `cap`) delegate to `@fw/site`.

## Remaining

1. **Prod schema** — `db:push` has never run against the production database
   (the tooling was broken until the config moved). Take a Neon branch as a
   restore point, then `DATABASE_URL="<prod>" npm run db:push`.
2. **Prod passkey E2E** — register + log in on the apex, and confirm `/app`
   loads data rather than erroring.
3. **Native re-verify** — `webDir`/`frontendDist` now point at `dist/client` and
   the origin defaults are the apex, but **no native build has been run since the
   merge**. Capacitor should be fine (the webview loads `CAP_SERVER_URL`), but
   Tauri bundles `frontendDist` and the applet is `prerender=false`, so it is
   **not** in the static output — desktop likely needs to load the remote origin
   too. Re-sync, rebuild, and verify a passkey ceremony **in-webview**.
4. **Stripe** — the webhook destination is pinned to API version `2017-06-05`,
   which predates Checkout Sessions; recreate it on a current version and run a
   test-mode checkout end to end.
5. **Retire the old Vercel project** — `fullstackwolfpack` (the `app.` subdomain)
   is Git-disconnected but still serving, and is the rollback path plus the
   current target of any installed native build. Delete after step 3.
6. If enabling dev-mode in prod, add an Astro IP-allowlist middleware at
   `apps/site/src/middleware.ts` (the old Vercel-edge version is in git history
   at `apps/web/middleware.ts`).

## Dev quickstart

```
npm run dev        # astro dev on :4321 — static pages + applet + /api/*, one server
npm test           # 483 unit tests (apps/site)
npm run build      # astro build → .vercel/output (1 function + prerendered pages)
```
`.env` lives at `apps/site/.env` (gitignored; copy from `.env.example`).
