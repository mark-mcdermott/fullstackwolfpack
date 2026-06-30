import { ProgressMeter } from '@/components/ui-kit'
import { useAuth } from '@/hooks/auth-context'
import { sampleUser } from '@/lib/sample-data'

export function AppHeader() {
  const { user } = useAuth()
  const name = user?.displayName?.toUpperCase() ?? sampleUser.greetingName
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
      <p className="font-mono text-xs tracking-widest uppercase">
        Good evening, {name} <span className="text-primary">++</span>
      </p>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs tracking-widest uppercase">
          Level {sampleUser.level}
        </span>
        <div className="hidden w-32 sm:block">
          <ProgressMeter value={(sampleUser.xp / sampleUser.xpToNext) * 100} />
        </div>
        <span className="hidden font-mono text-xs tracking-widest uppercase md:inline">
          XP {sampleUser.xp.toLocaleString()} / {sampleUser.xpToNext.toLocaleString()}
        </span>
      </div>
    </header>
  )
}
