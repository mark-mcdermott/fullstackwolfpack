import type { CSSProperties } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth-context'
import { FwFooter } from './fw-footer'
import { FwHeader } from './fw-header'

// The ported sign-in / sign-up design is light-only (like the Astro site it
// comes from). The app has a dark theme, so pin the FW-01 light token values
// here — the auth pages render as a self-contained light island regardless of
// the app's theme, while the dark header/footer read the same either way.
const lightTheme: CSSProperties = {
  '--background': 'oklch(0.963 0 0)',
  '--foreground': 'oklch(0.145 0 0)',
  '--card': 'oklch(1 0 0)',
  '--card-foreground': 'oklch(0.145 0 0)',
  '--muted-foreground': 'oklch(0.556 0 0)',
  '--border': 'oklch(0.922 0 0)',
  '--primary': 'oklch(0.6224 0.2526 28.44)',
  '--primary-foreground': 'oklch(0.985 0 0)',
} as CSSProperties

export function AuthChromeLayout() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/app" replace />

  return (
    <div
      style={lightTheme}
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      <FwHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <FwFooter />
    </div>
  )
}
