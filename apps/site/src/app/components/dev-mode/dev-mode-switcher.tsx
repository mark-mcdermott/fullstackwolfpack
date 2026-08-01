// Dev Mode role switcher — a floating 4-position control, top-right on every
// page, that flips between logged-out and three seeded test users. Mounted in
// main.tsx in local dev, or in a deploy where VITE_ENABLE_DEV_MODE=1 (opt-in).
// Deleted-later feature.
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth-context'
import {
  DEV_ROLES,
  DEV_ROLE_LABELS,
  resolveDevRole,
  type DevRole,
} from '@/core/dev-mode'

export function DevModeSwitcher() {
  const { user, refresh, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Collapsed on load — just the "User" label — to stay out of the way of the
  // UI underneath. Click the label to expand to the full "Test User" switch
  // (and click again to collapse).
  const [collapsed, setCollapsed] = useState(true)
  const active = resolveDevRole(user)

  async function select(role: DevRole) {
    if (busy || role === active) return
    setBusy(true)
    setError(null)
    try {
      if (role === 'off') {
        // "off" is regular mode: drop the dev session entirely.
        await logout()
      } else {
        const res = await fetch('/api/me/become', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ role }),
        })
        if (!res.ok) throw new Error(`switch failed (${res.status})`)
        await refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'switch failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed right-2 top-2 z-[100] w-fit select-none rounded-lg border border-border/60 bg-background/85 px-2 py-1.5 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand Test User' : 'Collapse Test User'}
        className={cn(
          'block w-full cursor-pointer text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground',
          !collapsed && 'mb-1',
        )}
      >
        {collapsed ? 'User' : 'Test User'}
      </button>
      {!collapsed && (
        <>
          <div
            role="group"
            aria-label="Dev Mode role"
            className="flex overflow-hidden rounded-md border border-border/60"
          >
            {DEV_ROLES.map((role) => {
              const isActive = role === active
              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={isActive}
                  disabled={busy}
                  onClick={() => select(role)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition-colors first:border-l-0 border-l border-border/60',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {DEV_ROLE_LABELS[role]}
                </button>
              )
            })}
          </div>
          {error && (
            <span role="alert" className="mt-1 block text-center text-[10px] text-destructive">
              {error}
            </span>
          )}
        </>
      )}
    </div>
  )
}
