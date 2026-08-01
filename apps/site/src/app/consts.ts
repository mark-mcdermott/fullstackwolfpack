// The public marketing site (the Astro app on the www/apex domain). The app
// no longer hosts its own marketing pages — it links out here for them, and
// sign-out returns the user to the site's logged-out home. Override in local
// dev with VITE_SITE_URL (e.g. http://localhost:4321).
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  'https://fullstackwolfpack.com'

export const siteUrl = (path = '') => `${SITE_URL}${path}`
