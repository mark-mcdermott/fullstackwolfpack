import { Lock, Trophy } from 'lucide-react'
import {
  PageHeading,
  Panel,
  ProgressMeter,
  SectionLabel,
} from '@/components/ui-kit'
import { sampleAchievements } from '@/lib/sample-data'

export function AchievementsPage() {
  const { earned, inProgress, locked } = sampleAchievements
  return (
    <div>
      <PageHeading
        label="Achievements"
        title="Achievements"
        subtitle="Unlock badges, earn rewards, and celebrate your progress."
      />
      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-3xl font-bold">18</p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Earned
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold">{inProgress.length}</p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              In progress
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold">{locked.length}</p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Locked
            </p>
          </div>
          <div className="ml-auto w-48">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              75% total completion
            </p>
            <ProgressMeter value={75} className="mt-1" />
          </div>
        </div>
      </Panel>

      <SectionLabel>Earned</SectionLabel>
      <div className="mt-4 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {earned.map((a) => (
          <Panel key={a.name} className="flex flex-col items-center gap-2 text-center">
            <Trophy className="size-8 text-primary" />
            <h3 className="text-sm font-bold uppercase">{a.name}</h3>
            <p className="font-mono text-[10px] text-muted-foreground">
              {a.description}
            </p>
            <p className="font-mono text-[10px] tracking-widest text-primary uppercase">
              Earned {a.date}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionLabel>In progress</SectionLabel>
          <div className="mt-4 flex flex-col gap-4">
            {inProgress.map((a) => (
              <div key={a.name}>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {a.current} / {a.target}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {a.description}
                </p>
                <ProgressMeter value={(a.current / a.target) * 100} className="mt-1" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionLabel>Locked</SectionLabel>
          <div className="mt-4 flex flex-col gap-4">
            {locked.map((a) => (
              <div key={a.name} className="flex items-center gap-3">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {a.current} / {a.target}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
