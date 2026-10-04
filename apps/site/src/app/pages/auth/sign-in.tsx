import {
  ArrowRight,
  BarChart3,
  Crosshair,
  Gamepad2,
  Lock,
  Mail,
  Target,
  Trophy,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthCardShell } from '@/components/auth/auth-card-shell'
import { AuthField } from '@/components/auth/auth-field'
import { HeroWolf } from '@/components/auth/hero-wolf'
import { WhyBox, type WhyItem } from '@/components/auth/why-box'
import { useAuth } from '@/hooks/auth-context'
import { authErrorMessage } from '@/lib/auth-error'

const WHY: WhyItem[] = [
  {
    icon: Target,
    title: 'Save Progress',
    body: 'Your progress is saved and ready whenever you are.',
  },
  {
    icon: BarChart3,
    title: 'Track Growth',
    body: 'See your stats, streaks, and real world progress.',
  },
  {
    icon: Gamepad2,
    title: 'Unlock Content',
    body: 'Access lessons, challenges, and exclusive features.',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    body: 'Level up, earn XP, and unlock new achievements.',
  },
]

export function SignInPage() {
  const { signIn, requestPasswordReset } = useAuth()
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (mode === 'forgot') {
        await requestPasswordReset(email)
        setSent(true)
      } else {
        await signIn(email, password)
        // On success the auth context sets `user`; AuthChromeLayout redirects.
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const submitLabel = pending
    ? mode === 'forgot'
      ? 'Sending…'
      : 'Signing in…'
    : mode === 'forgot'
      ? 'Email me a reset link'
      : 'Sign in'

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-8">
        <div className="grid items-center gap-y-10 md:grid-cols-2 md:gap-x-10">
          <div className="flex max-w-xl flex-col gap-6">
            <p className="font-mono text-xs tracking-normal text-primary uppercase">
              // Welcome back
            </p>
            <h1 className="font-heading text-4xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-5xl lg:text-[3.5rem]">
              <span className="block">Sign in</span>
              <span className="block">to continue</span>
              <span className="block">
                your <span className="text-primary">journey.</span>
              </span>
            </h1>
            <p className="max-w-md font-mono text-[15px] leading-relaxed text-neutral-700">
              Pick up where you left off.
              <br />
              Keep learning. Keep leveling up.
            </p>
          </div>
          <HeroWolf fm="FW · 02" />
        </div>
      </section>

      {/* Form card */}
      <section className="pb-10">
        <AuthCardShell eyebrow="Sign in" className="mx-auto max-w-4xl">
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
            <AuthField
              label="Email"
              id="email"
              icon={Mail}
              type="email"
              autoComplete="username"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {mode === 'signin' && (
              <AuthField
                label="Password"
                id="password"
                icon={Lock}
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Remember me — not supported.
              <label className="flex items-center gap-2.5 font-mono text-sm text-neutral-700">
                <input type="checkbox" /> Remember me
              </label>
              */}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'forgot' ? 'signin' : 'forgot')
                  setError(null)
                  setSent(false)
                }}
                className="ml-auto font-mono text-sm text-foreground underline decoration-[color:var(--primary)] decoration-dotted underline-offset-4 transition-colors hover:text-primary"
              >
                {mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}
              </button>
            </div>

            {sent && !error && (
              <p
                className="font-mono text-sm text-foreground"
                role="status"
              >
                If an account uses that address, a reset link is on its way.
                Check your inbox.
              </p>
            )}

            {error && (
              <p className="font-mono text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="fw-notch-br flex items-center gap-4 bg-primary px-6 py-4 font-heading text-sm font-bold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              <Crosshair className="h-6 w-6" strokeWidth={1.5} aria-hidden />
              <span className="h-6 w-px bg-white/40" />
              {submitLabel}
              <ArrowRight className="ml-auto h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>

            {/* Social auth — no OAuth providers wired.
            <SocialAuth label="Or continue with" />
            */}

            <p className="text-center font-mono text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80"
              >
                Sign up
              </Link>
            </p>
          </form>
        </AuthCardShell>
      </section>

      {/* Why sign in */}
      <section className="pb-14">
        <WhyBox eyebrow="Why sign in?" items={WHY} />
      </section>
    </div>
  )
}
