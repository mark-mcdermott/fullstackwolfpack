import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/auth-context'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'login' | 'register' | 'recover'

const COPY: Record<Mode, { title: string; description: string; submit: string }> =
  {
    login: {
      title: 'Welcome back',
      description: 'Sign in with your passkey.',
      submit: 'Sign in',
    },
    register: {
      title: 'Create your account',
      description: 'Register a passkey — no password needed.',
      submit: 'Create account',
    },
    recover: {
      title: 'Recover access',
      description: 'Lost your passkey? Enter a code from your authenticator app.',
      submit: 'Sign in with code',
    },
  }

export function AuthCard() {
  const { register, login, recover } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchTo(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (mode === 'register') await register(email, displayName)
      else if (mode === 'recover') await recover(email, token)
      else await login(email)
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setPending(false)
    }
  }

  const copy = COPY[mode]

  return (
    <Card className="w-full max-w-sm text-left">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username webauthn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {mode === 'register' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
          )}
          {mode === 'recover' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Authenticator code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? pendingLabel(mode) : copy.submit}
          </Button>
          {mode !== 'recover' && (
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => switchTo(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register'
                ? 'Already have an account? Sign in'
                : 'New here? Create an account'}
            </button>
          )}
          {mode === 'login' && (
            <button
              type="button"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => switchTo('recover')}
            >
              Lost your passkey? Use a recovery code
            </button>
          )}
          {mode === 'recover' && (
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => switchTo('login')}
            >
              Back to sign in
            </button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

function pendingLabel(mode: Mode): string {
  return mode === 'recover' ? 'Verifying…' : 'Waiting for passkey…'
}

function messageFor(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError') {
      return 'Passkey prompt was dismissed. Please try again.'
    }
    return err.message
  }
  return 'Something went wrong.'
}
