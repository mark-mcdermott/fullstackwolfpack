import {
  ArrowRight,
  BarChart3,
  Crosshair,
  Gamepad2,
  Mail,
  Target,
  Trophy,
  User,
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

export function SignUpPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await register(email, name)
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
            <h1 className="font-heading text-4xl leading-[0.95] tracking-tight uppercase sm:text-5xl lg:text-[3.5rem]">
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
                autoComplete="username webauthn"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Username — not used by the passkey flow.
              <AuthField label="Username" id="username" icon={AtSign}
                autoComplete="username" placeholder="Choose a username" />
              */}

              {/* Password + confirm + strength meter + requirements — passkey
                  auth has no password. Re-enable when password login is added.
              <AuthField label="Password" id="password" icon={Lock} type="password"
                autoComplete="new-password" placeholder="Create a password" />
              <div>Password strength meter…</div>
              <ul>At least 8 characters / One uppercase letter / One number…</ul>
              <AuthField label="Confirm password" id="confirm" icon={Lock}
                type="password" placeholder="Confirm your password" />
              */}
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
              {pending ? 'Waiting for passkey…' : 'Create account'}
              <ArrowRight className="ml-auto h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>

            {/* Social auth — passkey only, no OAuth providers wired.
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
