import { Check, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '@/api-client'
import { AnthropicKeyPanel } from '@/components/settings/anthropic-key-panel'
import { ControlsPanel } from '@/components/controls/controls-panel'
import { PageHeading, Panel, SectionLabel } from '@fw/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PRO_FEATURES, can, isPaid } from '@/core/access'
import { planFor } from '@/core/pricing'
import { useAuth } from '@/hooks/auth-context'
import { cn } from '@/lib/utils'

// Add / replace the user's OpenAI key. The key is write-only: we only ever learn
// whether one is on file, never read it back.
function OpenAiKeyPanel() {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    let active = true
    api.integrations
      .keyStatus()
      .then((s) => active && setHasKey(s.hasKey))
      .catch(() => active && setHasKey(false))
    return () => {
      active = false
    }
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setJustSaved(false)
    try {
      const status = await api.integrations.saveOpenAiKey(apiKey)
      setHasKey(status.hasKey)
      setApiKey('')
      setJustSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel>
      <SectionLabel>Integrations</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Add your OpenAI key to generate lessons. It's encrypted at rest and
        never shown again.
      </p>
      {hasKey && !justSaved && (
        <p className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary uppercase">
          <Check className="size-3.5" /> Key on file
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor="openai">OpenAI API key</Label>
        <Input
          id="openai"
          type="password"
          placeholder={hasKey ? '•••• enter a new key to replace' : 'sk-...'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      {error && (
        <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving || apiKey.trim() === ''}
        className="mt-4 bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : justSaved ? 'Saved ✓' : 'Save key'}
      </button>
    </Panel>
  )
}

const FEATURE_LABELS: Record<string, string> = {
  smart_intervals: 'Smart pause intervals',
  unlimited_topics: 'Unlimited active topics',
  ai_tutor: 'AI tutor + short-answer grading',
  advanced_stats: 'Advanced stats & skill insights',
}

// Billing — Stripe Checkout (upgrade) + Billing Portal (manage), plus the
// per-feature access list. Handles the `?checkout=success|cancelled` return.
function BillingPanel() {
  const { user, refresh } = useAuth()
  const [params, setParams] = useSearchParams()
  const tier = user?.tier ?? 'free'
  const plan = planFor(tier)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<'success' | 'cancelled' | null>(null)

  // Returning from Checkout: capture the outcome, refresh the user so a
  // just-activated Pro tier appears, then scrub the query param from the URL.
  useEffect(() => {
    const outcome = params.get('checkout')
    if (!outcome) return
    if (outcome === 'success') {
      setNotice('success')
      void refresh()
    } else if (outcome === 'cancelled') {
      setNotice('cancelled')
    }
    params.delete('checkout')
    setParams(params, { replace: true })
    // Mount-only: the return is always a fresh navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function start(kind: 'checkout' | 'portal') {
    setBusy(true)
    setError(null)
    try {
      const { url } =
        kind === 'checkout'
          ? await api.billing.checkout()
          : await api.billing.portal()
      window.location.href = url
    } catch (e) {
      setBusy(false)
      setError(
        e instanceof Error ? e.message : 'Billing is unavailable right now.',
      )
    }
  }

  return (
    <Panel>
      <SectionLabel>Billing</SectionLabel>
      {notice === 'success' && (
        <p className="mt-2 font-mono text-[10px] tracking-widest text-primary uppercase">
          ✓ Subscription active — welcome to Pro.
        </p>
      )}
      {notice === 'cancelled' && (
        <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Checkout cancelled — no charge was made.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm">
            Current plan: <span className="font-bold uppercase">{plan.name}</span>
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
          <button
            type="button"
            onClick={() => start('checkout')}
            disabled={busy}
            className="bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Redirecting…' : 'Upgrade to Pro'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start('portal')}
            disabled={busy}
            className="border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Opening…' : 'Manage subscription'}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
      )}
      <div className="mt-5 border-t border-border pt-4">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Feature access
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {PRO_FEATURES.map((f) => {
            const unlocked = user ? can(user, `feature.${f}`) : false
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
  )
}

export function SettingsPage() {
  const { user } = useAuth()

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
        <OpenAiKeyPanel />

        {/* AI tutor & grading — Anthropic (Claude) key (encrypted server-side) */}
        <AnthropicKeyPanel />

        {/* Arcade controls — keyboard + gamepad remapping (device-local) */}
        <ControlsPanel />

        {/* Billing — Stripe Checkout + Billing Portal */}
        <BillingPanel />

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
