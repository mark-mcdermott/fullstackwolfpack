import { ArrowRight, Crosshair, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuthCardShell } from '@/components/auth/auth-card-shell'
import { AuthField } from '@/components/auth/auth-field'
import { HeroWolf } from '@/components/auth/hero-wolf'
import { passwordSchema } from '@/core/schemas'
import { useAuth } from '@/hooks/auth-context'
import { authErrorMessage } from '@/lib/auth-error'

// Where the link in a password-reset email lands. better-auth puts the token in
// the query string (see `redirectTo` in api-client/api.ts).
const MIN_PASSWORD = 12

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    const check = passwordSchema.safeParse(password)
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? 'Choose a longer password.')
      return
    }

    setPending(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      // Sign-in is a deliberate second step: the reset proves control of the
      // inbox, not that whoever opened the link should be left signed in.
      setTimeout(() => void navigate('/login'), 1500)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <section className="relative overflow-hidden pt-10 pb-8">
        <div className="grid items-center gap-y-10 md:grid-cols-2 md:gap-x-10">
          <div className="flex max-w-xl flex-col gap-6">
            <p className="font-mono text-xs tracking-normal text-primary uppercase">
              // Reset password
            </p>
            <h1 className="font-heading text-4xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-5xl lg:text-[3.5rem]">
              <span className="block">Choose a</span>
              <span className="block">
                new <span className="text-primary">password.</span>
              </span>
            </h1>
            <p className="max-w-md font-mono text-[15px] leading-relaxed text-neutral-700">
              Pick something only you know.
              <br />
              Then get back to it.
            </p>
          </div>
          <HeroWolf fm="FW · 03" />
        </div>
      </section>

      <section className="pb-14">
        <AuthCardShell eyebrow="Reset password" className="mx-auto max-w-4xl">
          {token === '' ? (
            <p className="mt-8 font-mono text-sm text-destructive" role="alert">
              This reset link is missing its token, so it cannot be used. Ask
              for a fresh one from the{' '}
              <Link
                to="/login"
                className="text-primary underline decoration-dotted underline-offset-4"
              >
                sign-in page
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <AuthField
                  label="New password"
                  id="password"
                  icon={Lock}
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="font-mono text-xs text-muted-foreground">
                  At least {MIN_PASSWORD} characters.
                </p>
              </div>

              <AuthField
                label="Confirm new password"
                id="confirm"
                icon={Lock}
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {done && !error && (
                <p className="font-mono text-sm text-foreground" role="status">
                  Password changed. Taking you to sign in…
                </p>
              )}

              {error && (
                <p className="font-mono text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending || done}
                className="fw-notch-br flex items-center gap-4 bg-primary px-6 py-4 font-heading text-sm font-bold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                <Crosshair className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                <span className="h-6 w-px bg-white/40" />
                {pending ? 'Saving…' : 'Save new password'}
                <ArrowRight
                  className="ml-auto h-5 w-5"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </button>
            </form>
          )}
        </AuthCardShell>
      </section>
    </div>
  )
}
