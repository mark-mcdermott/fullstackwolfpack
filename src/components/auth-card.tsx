import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/use-auth'
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

type Mode = 'login' | 'register'

export function AuthCard() {
  const { user, loading, register, login, logout } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (mode === 'register') await register(email, displayName)
      else await login(email)
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    )
  }

  if (user) {
    return (
      <Card className="w-full max-w-sm text-left">
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
          <CardDescription>
            {user.displayName} · {user.email}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void logout()}
          >
            Sign out
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm text-left">
      <CardHeader>
        <CardTitle>
          {mode === 'register' ? 'Create your account' : 'Welcome back'}
        </CardTitle>
        <CardDescription>
          {mode === 'register'
            ? 'Register a passkey — no password needed.'
            : 'Sign in with your passkey.'}
        </CardDescription>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? 'Waiting for passkey…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register')
              setError(null)
            }}
          >
            {mode === 'register'
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </CardFooter>
      </form>
    </Card>
  )
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
