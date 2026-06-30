import { BarChart3, Brain, Gamepad2, Shield, Timer, Trophy } from 'lucide-react'
import { PageHeading, Panel } from '@/components/ui-kit'

const FEATURES = [
  { icon: Brain, title: 'AI lesson generation', body: 'Bring your OpenAI key; we build a full course — lessons, segments, quizzes — per topic.' },
  { icon: Gamepad2, title: 'Game-aware sessions', body: 'v1 pauses your own game; v2 adds a built-in ROM gallery the app controls.' },
  { icon: Timer, title: 'Smart intervals', body: 'Choose your play/learn split now; adaptive pacing is on the roadmap.' },
  { icon: Trophy, title: 'XP, streaks & achievements', body: 'A progression system designed to make consistency the default.' },
  { icon: BarChart3, title: 'Progress & stats', body: 'Topic mastery, focus scores, accuracy trends and a skills radar.' },
  { icon: Shield, title: 'Passwordless & private', body: 'Passkeys with a TOTP fallback. Your data, your control.' },
]

export function Features() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        label="Features"
        title="What's in the pack"
        subtitle="Everything you need to turn downtime into skill."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Panel key={f.title}>
            <f.icon className="size-6 text-primary" />
            <h3 className="mt-4 text-lg font-bold uppercase">{f.title}</h3>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {f.body}
            </p>
          </Panel>
        ))}
      </div>
    </div>
  )
}
