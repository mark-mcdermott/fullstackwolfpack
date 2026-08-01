import { StrictMode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/hooks/auth-provider'
import { TimerProvider } from '@/hooks/timer-provider'
import { DevModeSwitcher } from '@/components/dev-mode/dev-mode-switcher'
import App from '@/App'

// The React applet's root. This is the same provider stack the old Vite entry
// (main.tsx) mounted, minus the DOM createRoot — Astro mounts it as a
// `client:only="react"` island (see src/pages/[...slug].astro). index.css is
// loaded by the Astro page head so styles paint before hydration.
export default function AppRoot() {
  return (
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
          {/* Dev Mode role switcher — local dev, or an opt-in build with
              VITE_ENABLE_DEV_MODE=1. Tree-shaken out otherwise. */}
          {(import.meta.env.DEV ||
            import.meta.env.VITE_ENABLE_DEV_MODE === '1') && <DevModeSwitcher />}
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </StrictMode>
  )
}
