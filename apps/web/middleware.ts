import { ipAddress, next } from '@vercel/edge'

// Edge gate: restrict the app to a small IP allowlist while the dev-mode
// switcher is enabled in production. VITE_ENABLE_DEV_MODE exposes
// POST /api/me/become — a no-auth admin bypass — so we lock the whole app
// project to known IPs until that switch is removed. Runs on the app project
// only; the public www marketing site (separate Astro project) is unaffected.
//
// Configure via IP_ALLOWLIST in the app's Vercel env, comma-separated:
//   IP_ALLOWLIST="172.56.93.53,203.0.113.7"
// Empty/unset => gate disabled. This fail-open default is deliberate: a rotated
// mobile IP or a cleared env can't permanently lock you out — clear the var and
// redeploy to restore open access. A blocked response echoes the caller's
// detected IP so you can see exactly what to add (Vercel may see a different
// address than a "what's my IP" site, e.g. IPv6).

const ALLOWLIST = (process.env.IP_ALLOWLIST ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)

export default function middleware(request: Request): Response {
  if (ALLOWLIST.length === 0) return next()

  const ip = ipAddress(request)
  if (ip && ALLOWLIST.includes(ip)) return next()

  return new Response(`Access restricted.\nYour IP: ${ip ?? 'unknown'}\n`, {
    status: 403,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
