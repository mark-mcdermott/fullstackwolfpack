import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '@/hooks/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Setup = { uri: string; secret: string }

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data as T
}

// Authenticator-app enrollment: the TOTP fallback for a lost passkey.
export function TotpCard() {
  const { user, refresh } = useAuth()
  const [setup, setSetup] = useState<Setup | null>(null)
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<void>) {
    setError(null)
    setPending(true)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  if (user?.totpEnabled) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Authenticator app</p>
            <p className="text-xs text-muted-foreground">
              Enabled — your backup if you lose your passkey.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              void run(async () => {
                await post('/api/auth/totp/disable')
                await refresh()
              })
            }
          >
            Turn off
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">Authenticator app</p>
      <p className="text-xs text-muted-foreground">
        A backup code generator in case you lose your passkey.
      </p>

      {!setup ? (
        <Button
          size="sm"
          className="mt-3"
          disabled={pending}
          onClick={() =>
            void run(async () => {
              setSetup(await post<Setup>('/api/auth/totp/setup'))
            })
          }
        >
          {pending ? 'Preparing…' : 'Set up'}
        </Button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex justify-center rounded-lg bg-white p-3">
            <QRCodeSVG value={setup.uri} size={144} />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Scan with your authenticator, or enter this secret manually:
            <br />
            <code className="break-all">{setup.secret}</code>
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="totp">Enter the 6-digit code to confirm</Label>
            <Input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={pending || token.length < 6}
            onClick={() =>
              void run(async () => {
                await post('/api/auth/totp/enable', { token })
                await refresh()
                setSetup(null)
                setToken('')
              })
            }
          >
            {pending ? 'Confirming…' : 'Confirm & enable'}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
