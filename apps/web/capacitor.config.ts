import type { CapacitorConfig } from '@capacitor/cli';

// The native shells bundle the static `dist`, but the backend is serverless
// `/api/*` and — critically — passkeys/WebAuthn are bound to the deployed RP
// origin. A webview loading from `capacitor://localhost` would fail auth, so a
// production build points the whole webview at the deployed origin via
// CAP_SERVER_URL (e.g. `https://app.fullstackwolfpack.com`). Unset (dev) → the
// bundled build / a live-reload dev server. See docs/ROADMAP.md "Native shells".
const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.fullstackwolfpack.app',
  appName: 'Fullstack Wolfpack',
  webDir: 'dist',
  ...(serverUrl ? { server: { url: serverUrl, androidScheme: 'https' } } : {}),
};

export default config;
