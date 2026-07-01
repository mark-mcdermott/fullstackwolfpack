import { Gamepad2, GraduationCap, RefreshCw, Timer } from 'lucide-react'
import { PageHeading, Panel } from '@fw/ui'

const STEPS = [
  { icon: Gamepad2, title: 'Start a session', body: 'Pick a topic, set your play/learn split (e.g. 10 min play // 10 min learn), and start your game.' },
  { icon: Timer, title: 'Pause on your interval', body: 'When the play interval is up, the app pauses and brings you a lesson. v1 is a manual pause; smart intervals come next.' },
  { icon: GraduationCap, title: 'Learn the next chunk', body: 'A short AI-generated lesson on your topic — read, try some code, maybe answer a quiz.' },
  { icon: RefreshCw, title: 'Back to the game', body: 'Resume play. Each loop earns XP and keeps your streak alive.' },
]

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <PageHeading
        label="How it works"
        title="The loop"
        subtitle="Play, pause, learn, repeat — short bursts that compound."
      />
      <div className="flex flex-col gap-4">
        {STEPS.map((s, i) => (
          <Panel key={s.title} className="flex items-start gap-4">
            <s.icon className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-mono text-xs text-muted-foreground">
                STEP 0{i + 1}
              </p>
              <h3 className="text-lg font-bold uppercase">{s.title}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {s.body}
              </p>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
