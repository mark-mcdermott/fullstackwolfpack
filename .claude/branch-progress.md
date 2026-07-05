# Branch: feat/punchlist-items — COMPLETE (items 1–9; item 10 deferred)

All 9 in-scope punchlist items shipped. Item 10 (Stripe) deferred to its own branch by user decision.

- [x] 1. Sidebar brand → dashboard link (`sidebar-content.tsx`, `<Link to="/app">`).
- [x] 2. Dark-mode toggle on the Astro site (`Base.astro` header + `Icon.astro` moon/sun + `global.css` `:root:not(.dark)` fix + 5 white-CTA readability fixes).
- [x] 3. Longer courses — `buildGenerationPrompt` targets 6–8 lessons via `COURSE_TARGET`; schema stays permissive.
- [x] 4. Generate-course ETA progress bar + `generation_timings` table + `getGenerationEta` + GET `generation-eta`. Degrades to default ETA before `db:push`.
- [x] 5. Global `cursor: pointer` base rule (index.css + theme.css) — Tailwind v4 root fix.
- [x] 6. Deep-link topic/focus names → Topics card (`topicCoursePath`, `?topic=` scroll+highlight).
- [x] 7. Badges — derived from live stats (`core/achievements.ts` evaluator + server snapshot), Badges page shows earned/in-progress/locked with per-badge art.
- [x] 8. Gamepad button `rounded-md`.
- [x] 9. "Key mapping" heading above the mapping column.
- [ ] 10. [DEFERRED] Stripe → own branch.

## Verification
- Full web suite: 274 tests pass · `tsc --noEmit` clean · `npm run build` (web + site) pass · lint clean (1 pre-existing warning untouched).

## Follow-up for the user
- Run `npm run db:push -w @fw/web` to create the `generation_timings` table (feature works with a default ETA until then).
- Stripe billing = separate branch (greenfield; needs Stripe account/keys + a reclaimed function slot).
