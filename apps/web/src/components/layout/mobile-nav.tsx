import { LogOut, Menu, ShieldAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { ThemeToggle, WolfMark } from '@fw/ui'
import { can } from '@/core/access'
import { useAuth } from '@/hooks/auth-context'
import { useSignOut } from '@/lib/use-sign-out'
import { NAV, navItemClass } from './nav'

// The app's primary navigation for < lg screens, where the Sidebar is hidden.
// A hamburger opens a slide-in drawer with the same nav + sign-out.
export function MobileNav() {
  const { user } = useAuth()
  const signOut = useSignOut()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex size-9 items-center justify-center border border-border text-muted-foreground hover:text-foreground"
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col gap-5 border-r border-border bg-background p-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <WolfMark className="h-8 text-foreground" />
                <span className="font-mono text-sm font-bold tracking-widest">
                  FW-01
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navItemClass}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
              {user && can(user, 'admin.access') && (
                <NavLink
                  to="/admin"
                  className={navItemClass}
                  onClick={() => setOpen(false)}
                >
                  <ShieldAlert className="size-4" />
                  Admin
                </NavLink>
              )}
            </nav>

            <div className="mt-auto flex gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  void signOut()
                }}
                className="flex flex-1 items-center gap-3 border border-border px-3 py-2 font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:border-primary hover:text-primary"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
