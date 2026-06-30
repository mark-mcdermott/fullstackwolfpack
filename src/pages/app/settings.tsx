import { Check, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeading, Panel, SectionLabel } from '@/components/ui-kit'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PRO_FEATURES, can, isPaid } from '@/core/access'
import { planFor } from '@/core/pricing'
import { useAuth } from '@/hooks/auth-context'
import { cn } from '@/lib/utils'

const FEATURE_LABELS: Record<string, string> = {
  smart_intervals: 'Smart pause intervals',
  unlimited_topics: 'Unlimited active topics',
  ai_tutor: 'AI tutor + short-answer grading',
  advanced_stats: 'Advanced stats & skill insights',
}

export function SettingsPage() {
  const { user } = useAuth()
  const tier = user?.tier ?? 'free'
  const plan = planFor(tier)
  const [keySaved, setKeySaved] = useState(false)

  return (
    <div>
      <PageHeading
        label="Settings"
        title="Settings"
        subtitle="Customize your experience. Stay in control."
      />
      <div className="grid gap-5">
        {/* Profile */}
        <Panel>
          <SectionLabel>Profile</SectionLabel>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" defaultValue={user?.displayName ?? ''} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" defaultValue={user?.email ?? ''} />
            </div>
          </div>
          <button
            type="button"
            className="mt-4 bg-foreground px-4 py-2 font-mono text-xs tracking-widest text-background uppercase"
          >
            Save changes →
          </button>
        </Panel>

        {/* Integrations — OpenAI key (encrypted server-side) */}
        <Panel>
          <SectionLabel>Integrations</SectionLabel>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Add your OpenAI key to generate lessons. It's encrypted at rest and
            never shown again.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="openai">OpenAI API key</Label>
            <Input id="openai" type="password" placeholder="sk-..." />
          </div>
          <button
            type="button"
            onClick={() => setKeySaved(true)}
            className="mt-4 bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            {keySaved ? 'Saved ✓' : 'Save key'}
          </button>
        </Panel>

        {/* Billing — subscription stub */}
        <Panel>
          <SectionLabel>Billing</SectionLabel>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm">
                Current plan:{' '}
                <span className="font-bold uppercase">{plan.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  ${plan.priceMonthly}/mo
                </span>
              </p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {isPaid({ role: user?.role ?? 'user', tier })
                  ? 'Subscription active'
                  : 'Free tier'}
              </p>
            </div>
            {tier === 'free' ? (
              <Link
                to="/pricing"
                className="bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
              >
                Upgrade to Pro
              </Link>
            ) : (
              <button
                type="button"
                className="border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
              >
                Manage subscription
              </button>
            )}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Feature access
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {PRO_FEATURES.map((f) => {
                const unlocked = user
                  ? can(user, `feature.${f}`)
                  : false
                return (
                  <li
                    key={f}
                    className={cn(
                      'flex items-center gap-2 font-mono text-xs',
                      unlocked ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {unlocked ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                    {FEATURE_LABELS[f]}
                  </li>
                )
              })}
            </ul>
          </div>
        </Panel>

        {/* Data & privacy */}
        <Panel>
          <SectionLabel>Data & privacy</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted"
            >
              Export data
            </button>
            <button
              type="button"
              className="border border-destructive px-4 py-2 font-mono text-xs tracking-widest text-destructive uppercase hover:bg-destructive/10"
            >
              Delete account
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
