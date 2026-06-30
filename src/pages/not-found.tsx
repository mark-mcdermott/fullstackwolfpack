import { Link } from 'react-router'

export function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-6xl font-bold">404</p>
      <p className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
        Signal lost
      </p>
      <Link
        to="/"
        className="bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground uppercase hover:bg-primary/80"
      >
        Return home
      </Link>
    </div>
  )
}
