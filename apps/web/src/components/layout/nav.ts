import {
  BarChart3,
  Gamepad2,
  LayoutDashboard,
  Layers,
  LineChart,
  type LucideIcon,
  Medal,
  Repeat,
  Settings,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
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
  { to: '/app/progress', label: 'Progress', icon: BarChart3 },
  { to: '/app/stats', label: 'Stats', icon: LineChart },
  { to: '/app/achievements', label: 'Achievements', icon: Trophy },
  { to: '/app/badges', label: 'Badges', icon: ShieldCheck },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Medal },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2 font-mono text-sm tracking-wide uppercase transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  )
