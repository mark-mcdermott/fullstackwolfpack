# Aesthetics & UX punchlist

Branch `fix/aesthetics-and-ux-punchlist` (worktree). Order agreed: **1 → 2 → 3 → 5**.
Commit per item; one PR at the end. Favicon (4) is Mark's (Illustrator).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Plan

- `[x]` **1 — Real wolf-sun art.** `wolf-sun.png` → landing, dashboard, sign-up,
  log-in; `wolf-rear-and-sun.png` → 404. `WolfSun` now renders the real
  transparent PNG with a `variant` (`sun` default / `rear` for 404).
- `[x]` **2 — Theme consistency: light is the default.** Dropped the forced
  `class="dark"` on the Astro site; added the same no-FOUC script the app uses
  (light default, honor a saved `dark` on the shared domain). Both surfaces cohere.
- `[x]` **3 — State polish.** Wired `reload()` through `useAsync` → `AsyncView`
  so error states get a **Retry** button (no call-site churn); centered the
  loading spinner. Applies to every page via the shared components. Empty-state
  copy was already good — left as-is.
- `[x]` **5 — Mobile responsiveness spot-check.** Fixed the real bug: the
  sidebar (primary nav) is hidden < lg with **no replacement** → added a
  hamburger **mobile drawer** (`mobile-nav.tsx`) reusing shared nav data
  (`nav.ts`, extracted from the sidebar). Also: truncate the header greeting so
  it can't overflow; tightened the lesson-complete stat grid gap on mobile.
  Admin table already scrolls (`overflow-x-auto`). Deeper per-screen visual QA
  can continue as new items.

## Mark's items (add anytime)

- …

## Done

- 1 — real wolf-sun art (WolfSun → real PNG + `variant`; 404 uses `rear`).
