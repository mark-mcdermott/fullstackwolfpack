import { ShieldCheck } from 'lucide-react'
import { PageHeading, Panel } from '@/components/ui-kit'
import { sampleAchievements } from '@/lib/sample-data'

const BADGES = [
  ...sampleAchievements.earned.map((a) => ({ ...a, earned: true })),
  ...sampleAchievements.inProgress.map((a) => ({
    name: a.name,
    description: a.description,
    earned: false,
  })),
]

export function BadgesPage() {
  return (
    <div>
      <PageHeading
        label="Badges"
        title="Badges"
        subtitle="The marks of your progress. Earn them all."
      />
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BADGES.map((b) => (
          <Panel
            key={b.name}
            className="flex flex-col items-center gap-2 text-center"
          >
            <ShieldCheck
              className={b.earned ? 'size-8 text-primary' : 'size-8 text-muted-foreground'}
            />
            <h3 className="text-sm font-bold uppercase">{b.name}</h3>
            <p className="font-mono text-[10px] text-muted-foreground">
              {b.description}
            </p>
          </Panel>
        ))}
      </div>
    </div>
  )
}
