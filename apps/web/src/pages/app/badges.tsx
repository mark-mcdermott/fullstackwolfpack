import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import type { AchievementItem } from '@/core/app-data'
import { PageHeading, Panel, ProgressMeter } from '@fw/ui'
import { useAsync } from '@/hooks/use-async'
import { badgeIcon } from '@/lib/badge-icons'
import { cn } from '@/lib/utils'

type Badge = AchievementItem & { earned: boolean }

function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = badgeIcon(badge.slug)
  const pct =
    badge.target > 0
      ? Math.min(100, Math.round((badge.current / badge.target) * 100))
      : 0

  return (
    <Panel className="flex flex-col items-center gap-3 text-center">
      <div
        className={cn(
          'flex size-14 items-center justify-center rounded-full border',
          badge.earned
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-muted/40 text-muted-foreground',
        )}
      >
        <Icon className="size-7" />
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase">{badge.name}</h3>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {badge.description}
        </p>
      </div>
      {badge.earned ? (
        <span className="mt-auto font-mono text-[10px] tracking-widest text-primary uppercase">
          ✓ Earned
        </span>
      ) : (
        <div className="mt-auto w-full">
          <ProgressMeter value={pct} />
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {badge.current} / {badge.target}
          </p>
        </div>
      )}
    </Panel>
  )
}

export function BadgesPage() {
  const state = useAsync(() => api.data.achievements())

  return (
    <div>
      <PageHeading
        label="Badges"
        title="Badges"
        subtitle="The marks of your progress. Earn them all."
      />
      <AsyncView state={state}>
        {(view) => {
          // Earned first, then in-progress, then the still-locked ones so the
          // full set is always visible (with progress) — not an empty page.
          const badges: Badge[] = [
            ...view.earned.map((a) => ({ ...a, earned: true })),
            ...view.inProgress.map((a) => ({ ...a, earned: false })),
            ...view.locked.map((a) => ({ ...a, earned: false })),
          ]
          if (badges.length === 0) {
            return (
              <EmptyState message="No badges yet — start a lesson to earn your first." />
            )
          }
          return (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {badges.map((b) => (
                <BadgeCard key={b.slug} badge={b} />
              ))}
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
