import { ShieldCheck } from 'lucide-react'
import { api } from '@/api-client'
import { AsyncView, EmptyState } from '@/components/layout/async-view'
import { PageHeading, Panel } from '@/components/ui-kit'
import { useAsync } from '@/hooks/use-async'

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
          const badges = [
            ...view.earned.map((a) => ({ ...a, earned: true })),
            ...view.inProgress.map((a) => ({ ...a, earned: false })),
          ]
          if (badges.length === 0) {
            return (
              <EmptyState message="No badges yet — start a lesson to earn your first." />
            )
          }
          return (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {badges.map((b) => (
                <Panel
                  key={b.slug}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <ShieldCheck
                    className={
                      b.earned
                        ? 'size-8 text-primary'
                        : 'size-8 text-muted-foreground'
                    }
                  />
                  <h3 className="text-sm font-bold uppercase">{b.name}</h3>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {b.description}
                  </p>
                </Panel>
              ))}
            </div>
          )
        }}
      </AsyncView>
    </div>
  )
}
