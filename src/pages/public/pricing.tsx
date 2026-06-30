import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeading, Panel } from '@/components/ui-kit'
import { PLANS } from '@/core/pricing'
import { cn } from '@/lib/utils'

export function Pricing() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <PageHeading
        label="Pricing"
        title="Pick your pack"
        subtitle="Start free. Upgrade when you want unlimited topics and the smart stuff."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Panel
            key={plan.tier}
            className={cn('flex flex-col', plan.featured && 'border-primary')}
          >
            {plan.featured && (
              <span className="mb-2 w-fit bg-primary px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary-foreground uppercase">
                Most popular
              </span>
            )}
            <h3 className="text-2xl font-bold uppercase">{plan.name}</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {plan.tagline}
            </p>
            <p className="mt-4">
              <span className="text-4xl font-bold">${plan.priceMonthly}</span>
              <span className="font-mono text-xs text-muted-foreground">/mo</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 font-mono text-xs">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={cn(
                'mt-6 px-4 py-2.5 text-center font-mono text-xs tracking-widest uppercase',
                plan.featured
                  ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                  : 'border border-border hover:bg-muted',
              )}
            >
              {plan.cta}
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  )
}
