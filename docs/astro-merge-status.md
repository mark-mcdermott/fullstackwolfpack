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

## Remaining — Phase 5 (needs interactive access; NOT done autonomously)

1. **Vercel project** — single project, Root Directory `apps/site`, domain
   `fullstackwolfpack.com` (apex). Retire the old two-project subdomain split.
2. **Env vars** on that project: `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`,
   `RP_ID=fullstackwolfpack.com`, `RP_ORIGIN=https://fullstackwolfpack.com`,
   plus optional `STRIPE_*`, AI keys, `ABLY_API_KEY`. See `apps/site/.env.example`.
3. **Local passkey E2E** — set `apps/site/.env` `RP_ORIGIN=http://localhost:4321`,
   `npm run dev`, register + log in a passkey against the one dev origin.
4. **Native shells** (still in `apps/web/{ios,android,src-tauri}`) — re-point at the
   Astro build + apex origin (`CAP_SERVER_URL`/`VITE_API_BASE`/`capacitor.config`
   `webDir`, Tauri `frontendDist`), re-sync/re-sign, and verify a passkey ceremony
   **in-webview**. Consider relocating the native projects under `apps/site`.
5. **Delete `apps/web`** once native builds target `apps/site` (its `src/`+`api/`
   already moved; only native shells + dead web-SPA configs remain). Re-point the
   `db:*`/`tauri`/`cap` root scripts + move `drizzle.config.ts`/`scripts/` to
   `apps/site`. If enabling dev-mode in prod, port `middleware.ts` to
   `apps/site/src/middleware.ts` (Astro middleware IP allowlist).

## Dev quickstart

```
npm run dev        # astro dev on :4321 — static pages + applet + /api/*, one server
npm test           # 483 unit tests (apps/site)
npm run build      # astro build → .vercel/output (1 function + prerendered pages)
```
`.env` lives at `apps/site/.env` (gitignored; copy from `.env.example`).
