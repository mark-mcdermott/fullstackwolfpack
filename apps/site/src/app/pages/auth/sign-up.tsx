import {
  ArrowRight,
  BarChart3,
  Crosshair,
  Gamepad2,
  Lock,
  Mail,
  Target,
  Trophy,
  User,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { clearClaimedUsername, getClaimedUsername } from '@/lib/guest-identity'
import { AuthCardShell } from '@/components/auth/auth-card-shell'
import { AuthField } from '@/components/auth/auth-field'
import { HeroWolf } from '@/components/auth/hero-wolf'
import { WhyBox, type WhyItem } from '@/components/auth/why-box'
import { passwordSchema } from '@/core/schemas'
import { useAuth } from '@/hooks/auth-context'
import { authErrorMessage } from '@/lib/auth-error'

const WHY: WhyItem[] = [
  {
    icon: Target,
    title: 'Real World Skills',
    body: 'Learn practical skills used by developers every day.',
  },
  {
    icon: Gamepad2,
    title: 'Learn by Doing',
    body: 'Interactive lessons, challenges, and hands-on practice.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    body: 'See your growth, earn XP, and level up your skills.',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    body: 'Unlock achievements and prove your expertise.',
  },
]

// Mirrors better-auth's minPasswordLength so the form can say so before a
// round trip; the server rejects anything shorter regardless.
const MIN_PASSWORD = 12

export function SignUpPage() {
  const { signUp } = useAuth()
  // Prefill the name from a username a guest claimed (e.g. on the leaderboard).
  const [name, setName] = useState(() => getClaimedUsername())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Caught here rather than server-side, so the mismatch is pointed out
    // without a round trip that would also have created nothing.
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
      await signUp(email, password, name)
      clearClaimedUsername()
      // On success the auth context sets `user`; AuthChromeLayout redirects.
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-8">
        <div className="grid items-center gap-y-10 md:grid-cols-2 md:gap-x-10">
          <div className="flex max-w-xl flex-col gap-6">
            <p className="font-mono text-xs tracking-normal text-primary uppercase">
              // Join the pack
            </p>
            <h1 className="font-heading text-4xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-5xl lg:text-[3.5rem]">
              <span className="block">Create</span>
              <span className="block">
                your <span className="text-primary">account.</span>
              </span>
            </h1>
            <p className="max-w-md font-mono text-[15px] leading-relaxed tracking-wide text-neutral-700 uppercase">
              Start your journey.
              <br />
              Learn. Play. Level up.
            </p>
          </div>
          <HeroWolf />
        </div>
      </section>

      {/* Form card */}
      <section className="pb-10">
        <AuthCardShell eyebrow="Sign up">
          <form onSubmit={onSubmit} className="mt-8">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              <AuthField
                label="Full name"
                id="name"
                icon={User}
                autoComplete="name"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <AuthField
                label="Email address"
                id="email"
                icon={Mail}
                type="email"
                autoComplete="username"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Username — claimed separately in Settings, not at signup.
              <AuthField label="Username" id="username" icon={AtSign}
                autoComplete="username" placeholder="Choose a username" />
              */}

              <div className="flex flex-col gap-2">
                <AuthField
                  label="Password"
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
                label="Confirm password"
                id="confirm"
                icon={Lock}
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {error && (
              <p className="mt-6 font-mono text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="fw-notch-br mt-8 flex w-full items-center gap-4 bg-primary px-6 py-4 font-heading text-sm font-bold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              <Crosshair className="h-6 w-6" strokeWidth={1.5} aria-hidden />
              <span className="h-6 w-px bg-white/40" />
              {pending ? 'Creating account…' : 'Create account'}
              <ArrowRight className="ml-auto h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>

            {/* Social auth — no OAuth providers wired.
            <SocialAuth label="Or sign up with" />
            */}

            <p className="mt-9 text-center font-mono text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-80"
              >
                Log in
              </Link>
            </p>
          </form>
        </AuthCardShell>
      </section>

      {/* Why join */}
      <section className="pb-14">
        <WhyBox eyebrow="Why join Fullstack Wolfpack?" items={WHY} />
      </section>
    </div>
  )
}
