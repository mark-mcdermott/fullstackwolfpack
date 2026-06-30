import { useEffect, useState } from 'react'
import { api } from '@/api-client'
import { useAuth } from '@/hooks/auth-context'
import { TotpCard } from '@/components/totp-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function Dashboard() {
  const { user, logout } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .getProtected()
      .then((d) => {
        if (active) setMessage(d.message)
      })
      .catch((e: Error) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="w-full max-w-md text-left">
      <CardHeader>
        <CardTitle>Protected area</CardTitle>
        <CardDescription>
          Only rendered with a valid session cookie.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium">{user?.displayName}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Response from /api/protected
          </p>
          {message ? (
            <p className="text-sm">{message}</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </div>
        <TotpCard />
      </CardContent>
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
