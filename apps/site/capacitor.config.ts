import type { CapacitorConfig } from '@capacitor/cli';

// The backend is serverless `/api/*` and — critically — passkeys/WebAuthn are
// bound to the deployed RP origin. A webview loading from `capacitor://localhost`
// would fail auth, so a production build points the whole webview at the deployed
// origin via CAP_SERVER_URL (now the apex, `https://fullstackwolfpack.com`, not
// the retired app. subdomain). See docs/ROADMAP.md "Native shells".
//
// `webDir` is only the offline fallback: since the Astro merge the applet route
// is `prerender=false`, so the bundled output holds the prerendered marketing
// pages and client assets but NOT /app. A packaged build must reach the origin.
const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.fullstackwolfpack.app',
  appName: 'Fullstack Wolfpack',
  // `astro build` with the Vercel adapter leaves static output in dist/client.
  webDir: 'dist/client',
  ...(serverUrl ? { server: { url: serverUrl, androidScheme: 'https' } } : {}),
};

export default config;
