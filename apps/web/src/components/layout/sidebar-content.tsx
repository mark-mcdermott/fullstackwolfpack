import { LogOut, ShieldAlert } from 'lucide-react'
import { NavLink } from 'react-router'
import { Panel, ThemeToggle, WolfMark } from '@fw/ui'
import { can } from '@/core/access'
import { useAuth } from '@/hooks/auth-context'
import { cn } from '@/lib/utils'
import { useSignOut } from '@/lib/use-sign-out'
import { NAV, navItemClass } from './nav'

// A thin "barcode" strip — a decorative FW-01 flourish.
function Barcode({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-3.5 w-full text-muted-foreground', className)}
      style={{
        background:
          'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 2px, currentColor 2px 5px, transparent 5px 6px, currentColor 6px 7px, transparent 7px 10px)',
      }}
    />
  )
}

// The full sidebar body — brand block, nav, and the status + sign-out footer.
// Shared by the desktop Sidebar and the mobile drawer so both render identically;
// `onNavigate` lets the drawer close itself when a nav link is tapped.
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  const signOut = useSignOut()
  return (
    <>
      {/* Brand block */}
      <div className="flex flex-col items-center gap-3 border-b border-border pb-5">
        <span className="w-fit self-start border border-foreground px-1.5 py-0.5 font-mono text-xs font-bold">
          FW-01
        </span>
        <WolfMark className="h-24 text-foreground" />
        <div className="text-center leading-tight">
          <p className="font-mono text-sm font-bold">FULLSTACK WOLFPACK</p>
          <p className="font-mono text-xs tracking-widest text-primary">
            ウルフパック
          </p>
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            v1.0.0
          </span>
          <Barcode className="flex-1" />
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navItemClass}
            onClick={onNavigate}
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
        {user && can(user, 'admin.access') && (
          <NavLink to="/admin" className={navItemClass} onClick={onNavigate}>
            <ShieldAlert className="size-4" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Panel brackets className="p-3">
          <p className="font-mono text-[10px] tracking-widest uppercase">
            System Status <span className="animate-pulse text-primary">●</span>
          </p>
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase">
            Online
          </p>
          <Barcode className="mt-2" />
        </Panel>
        <div className="flex gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex flex-1 items-center gap-3 border border-border px-3 py-2 font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:border-primary hover:text-primary"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
