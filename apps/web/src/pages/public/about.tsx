import { PageHeading, Panel } from '@fw/ui'

export function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <PageHeading
        label="About"
        title="Why we built this"
        subtitle="Screen time isn't the enemy — wasted screen time is."
      />
      <div className="flex flex-col gap-4 font-mono text-sm leading-relaxed text-muted-foreground">
        <p>
          Fullstack Wolfpack started with a simple question: what if the breaks
          in your gaming sessions could quietly make you a better developer?
        </p>
        <p>
          Instead of fighting the urge to play, we lean into it — pairing short,
          focused lessons with the downtime you already take. A few minutes of
          learning between rounds adds up faster than you'd think.
        </p>
        <p>
          Everything is built to keep the loop frictionless: AI generates the
          curriculum, the gamification keeps you honest, and the whole thing
          runs across web, mobile and desktop.
        </p>
        <Panel className="mt-2">
          <p className="text-foreground">Turn screen time into real world skills.</p>
        </Panel>
      </div>
    </div>
  )
}
