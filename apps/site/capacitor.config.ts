import type { CapacitorConfig } from '@capacitor/cli';

// The backend is serverless `/api/*` and — critically — passkeys/WebAuthn are
// bound to the deployed RP origin. A webview loading from `capacitor://localhost`
// would fail auth, so a production build points the whole webview at the deployed
// origin via CAP_SERVER_URL (now the apex, `https://fullstackwolfpack.com`, not
// the retired app. subdomain). See docs/ROADMAP.md "Native shells".
//
// `webDir` is never the real app once CAP_SERVER_URL is set — the webview loads
// the origin. And since the Astro merge there is nothing useful to bundle
// anyway: the applet route is `prerender=false`, so /app is absent from the
// static output. So a prod build ships `native-shell/` (a ~1KB offline notice)
// instead of dist/client, keeping ~49MB of arcade games, ROMs and imagery out
// of the app bundle. Without CAP_SERVER_URL (local dev) it still bundles
// dist/client, which serves the prerendered marketing pages.
const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.fullstackwolfpack.app',
  appName: 'Fullstack Wolfpack',
  // `astro build` with the Vercel adapter leaves static output in dist/client.
  webDir: serverUrl ? 'native-shell' : 'dist/client',
  ...(serverUrl ? { server: { url: serverUrl, androidScheme: 'https' } } : {}),
};

export default config;
