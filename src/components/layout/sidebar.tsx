import {
  BarChart3,
  Gamepad2,
  LayoutDashboard,
  Layers,
  LineChart,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Trophy,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/ui-kit'
import { can } from '@/core/access'
import { useAuth } from '@/hooks/auth-context'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/sessions', label: 'Sessions', icon: Timer },
  { to: '/app/arcade', label: 'Arcade', icon: Gamepad2 },
  { to: '/app/topics', label: 'Topics', icon: Layers },
  { to: '/app/progress', label: 'Progress', icon: BarChart3 },
  { to: '/app/stats', label: 'Stats', icon: LineChart },
  { to: '/app/achievements', label: 'Achievements', icon: Trophy },
  { to: '/app/badges', label: 'Badges', icon: ShieldCheck },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2 font-mono text-sm tracking-wide uppercase transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  )

export function Sidebar() {
  const { user } = useAuth()
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-border p-5 lg:flex">
      <span className="w-fit border border-foreground px-1.5 py-0.5 font-mono text-xs font-bold">
        FW-01
      </span>
      <Logo />
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
        {user && can(user, 'admin.access') && (
          <NavLink to="/admin" className={itemClass}>
            <ShieldAlert className="size-4" />
            Admin
          </NavLink>
        )}
      </nav>
      <div className="mt-auto border border-border p-3">
        <p className="font-mono text-[10px] tracking-widest uppercase">
          System Status <span className="text-primary">●</span>
        </p>
        <p className="font-mono text-[10px] tracking-widest text-primary uppercase">
          Online
        </p>
      </div>
    </aside>
  )
}
