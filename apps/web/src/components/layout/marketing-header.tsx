import { Link, NavLink } from 'react-router'
import { ThemeToggle } from '@fw/ui'
import { Logo } from '@fw/ui'
import { cn } from '@/lib/utils'

const LINKS: [string, string][] = [
  ['How It Works', '/how-it-works'],
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['Blog', '/blog'],
]

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/" aria-label="Home">
          <Logo />
        </Link>
        <nav className="hidden gap-6 md:flex">
          {LINKS.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'font-mono text-xs tracking-widest uppercase',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden font-mono text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="bg-primary px-3 py-1.5 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
