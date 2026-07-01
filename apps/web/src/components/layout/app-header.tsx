import { api } from '@/api-client'
import { ThemeToggle } from '@fw/ui'
import { ProgressMeter } from '@fw/ui'
import { useAuth } from '@/hooks/auth-context'
import { useAsync } from '@/hooks/use-async'
import { MobileNav } from './mobile-nav'

export function AppHeader() {
  const { user } = useAuth()
  const { data: summary } = useAsync(() => api.data.summary())
  const name = (user?.displayName ?? summary?.displayName ?? '—').toUpperCase()
  const nextThreshold = summary ? summary.xp + summary.xpToNext : 0

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <p className="truncate font-mono text-xs tracking-widest uppercase">
          Good evening, {name} <span className="text-primary">++</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle className="lg:hidden" />
        <span className="font-mono text-xs tracking-widest uppercase">
          Level {summary?.level ?? '—'}
        </span>
        <div className="hidden w-32 sm:block">
          <ProgressMeter value={summary?.levelPct ?? 0} />
        </div>
        <span className="hidden font-mono text-xs tracking-widest uppercase md:inline">
          XP{' '}
          {summary
            ? `${summary.xp.toLocaleString()} / ${nextThreshold.toLocaleString()}`
            : '—'}
        </span>
      </div>
    </header>
  )
}
