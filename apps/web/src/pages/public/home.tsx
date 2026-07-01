import { Brain, Gamepad2, GraduationCap, Timer, Trophy, Zap } from 'lucide-react'
import { Link } from 'react-router'
import { Panel, Pill, SectionLabel } from '@fw/ui'
import { WolfSun } from '@fw/ui'
import { PLANS } from '@/core/pricing'

const STEPS = [
  { icon: Gamepad2, title: 'Play your game', body: 'Fire up Steam, a ROM, anything. Set your interval.' },
  { icon: Timer, title: 'Pause on cue', body: 'At your interval the app taps you on the shoulder.' },
  { icon: GraduationCap, title: 'Learn a chunk', body: 'A short AI lesson on your topic — sometimes a quiz.' },
]

const FEATURES = [
  { icon: Brain, title: 'AI-built lessons', body: 'Bring your OpenAI key; we generate a full course per topic.' },
  { icon: Zap, title: 'Smart intervals', body: 'A pause cadence that adapts to how you actually learn.' },
  { icon: Trophy, title: 'Leveling that sticks', body: 'XP, streaks and achievements turn habit into mastery.' },
]

export function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Pill>AI-powered learning platform</Pill>
            <h1 className="mt-6 text-5xl leading-[0.95] font-bold tracking-tight uppercase sm:text-7xl">
              Learn. Play. <span className="text-primary">Level up.</span>
            </h1>
            <p className="mt-6 max-w-md font-mono text-sm text-muted-foreground">
              Fullstack Wolfpack pauses your game and slips in a short lesson on
              the tech you want to learn. Turn screen time into real-world skills.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="bg-primary px-5 py-3 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
              >
                Start learning →
              </Link>
              <Link
                to="/how-it-works"
                className="border border-border px-5 py-3 font-mono text-xs tracking-widest uppercase hover:bg-muted"
              >
                How it works
              </Link>
            </div>
            <p className="mt-6 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              30 min play // 10 min learn
            </p>
          </div>
          <WolfSun className="mx-auto size-72 sm:size-80 lg:size-96" />
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SectionLabel>How it works</SectionLabel>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Panel key={s.title}>
                <s.icon className="size-6 text-primary" />
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  STEP 0{i + 1}
                </p>
                <h3 className="mt-1 text-lg font-bold uppercase">{s.title}</h3>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {s.body}
                </p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionLabel>Why it works</SectionLabel>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
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
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <SectionLabel className="text-center">Pricing</SectionLabel>
          <h2 className="mt-3 text-3xl font-bold uppercase">
            Free to start. {PLANS[1].name} when you're hooked.
          </h2>
          <Link
            to="/pricing"
            className="mt-6 inline-block bg-primary px-5 py-3 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            See plans
          </Link>
        </div>
      </section>
    </div>
  )
}
