import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { Panel, SectionLabel } from '@/components/ui-kit'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Add / replace the user's Anthropic (Claude) key — powers the AI tutor and
// short-answer grading. Write-only, exactly like the OpenAI key: we only ever
// learn whether one is on file.
export function AnthropicKeyPanel() {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    let active = true
    api.integrations
      .anthropicKeyStatus()
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
      const status = await api.integrations.saveAnthropicKey(apiKey)
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
      <SectionLabel>AI tutor & grading</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Add your Anthropic (Claude) key to power the AI tutor and short-answer
        grading. It's encrypted at rest and never shown again.
      </p>
      {hasKey && !justSaved && (
        <p className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary uppercase">
          <Check className="size-3.5" /> Key on file
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor="anthropic">Anthropic API key</Label>
        <Input
          id="anthropic"
          type="password"
          placeholder={hasKey ? '•••• enter a new key to replace' : 'sk-ant-...'}
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
