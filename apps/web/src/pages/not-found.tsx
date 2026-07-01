import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { SectionLabel } from '@fw/ui'
import { WolfSun } from '@fw/ui'

export function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <SectionLabel>Error</SectionLabel>
          <p className="font-mono text-7xl leading-none font-bold sm:text-8xl">
            404
          </p>
          <h1 className="text-2xl font-bold uppercase">
            Target not found<span className="text-primary">.</span>
          </h1>
          <p className="max-w-sm font-mono text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
            >
              Return home <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/app/topics"
              className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              Browse topics
            </Link>
          </div>
        </div>
        <WolfSun variant="rear" className="mx-auto size-64 md:size-80" />
      </div>
    </div>
  )
}
