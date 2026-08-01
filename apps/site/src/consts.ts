// Single origin now: the React app (the `client:only` applet) is served from
// this same Astro deployment under /app, so app links are same-origin relative
// paths. Kept as a constant so every `${APP_URL}/app` CTA resolves to `/app`
// without per-link edits. See docs/astro-merge-plan.md.
export const APP_URL = ''
