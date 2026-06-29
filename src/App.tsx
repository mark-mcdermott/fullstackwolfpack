import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          ZENCATS · cross-platform
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Fullstack Wolfpack
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Vite + React, Drizzle on Neon, passkey auth, with Capacitor and Tauri
          shells — scaffolded and ready to build on.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg">Get started</Button>
        <Button
          size="lg"
          variant="outline"
          render={
            <a
              href="https://fullstackwolfpack.com"
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          Learn more
        </Button>
      </div>
    </main>
  )
}

export default App
