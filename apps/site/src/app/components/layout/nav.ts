import {
  Gamepad2,
  LayoutDashboard,
  Layers,
  type LucideIcon,
  Repeat,
  Timer,
  Users,
  // Temporarily hidden while we tighten the core flow (see NAV below):
  // BarChart3, LineChart, Medal, Settings, ShieldCheck, Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

// Primary app navigation — shared by the desktop Sidebar and the mobile drawer.
export const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/sessions', label: 'Sessions', icon: Timer },
  { to: '/app/arcade', label: 'Arcade', icon: Gamepad2 },
  { to: '/app/friends', label: 'Friends', icon: Users },
  { to: '/app/topics', label: 'Topics', icon: Layers },
  { to: '/app/review', label: 'Review', icon: Repeat },
  // Hidden for now — zooming in on the core flow (Dashboard → Sessions →
  // Arcade → Friends → Topics → Review). The routes still exist; only the nav
  // links are out. Restore by uncommenting these (and their icon imports).
  // { to: '/app/progress', label: 'Progress', icon: BarChart3 },
  // { to: '/app/stats', label: 'Stats', icon: LineChart },
  // { to: '/app/achievements', label: 'Achievements', icon: Trophy },
  // { to: '/app/badges', label: 'Badges', icon: ShieldCheck },
  // { to: '/app/leaderboard', label: 'Leaderboard', icon: Medal },
  // { to: '/app/settings', label: 'Settings', icon: Settings },
]

export const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2 font-mono text-sm tracking-wide uppercase transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  )
