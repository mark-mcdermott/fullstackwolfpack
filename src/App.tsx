import { AuthCard } from '@/components/auth-card'

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          ZENCATS · passwordless
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Fullstack Wolfpack
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Passkey sign-in with a TOTP fallback — no passwords. Built on Vite,
          Drizzle on Neon, with Capacitor and Tauri shells.
        </p>
      </div>
      <AuthCard />
    </main>
  )
}

export default App
