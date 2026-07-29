import { Navigate } from 'react-router'
import { SessionLauncher } from '@/components/launch/session-launcher'
import { PageHeading } from '@fw/ui'
import { useAuth } from '@/hooks/auth-context'

// The guest front door (`/`): logged-out visitors land here — the session
// launcher in guest mode — instead of being bounced to the marketing site.
// Signed-in users go straight to the app. Rendered under GuestLayout, so it
// carries the guest header/footer + the "sign up to save progress" banner.
export function GuestHome() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/app" replace />

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        label="Play & learn"
        title="Turn screen time into skills"
        subtitle="Pick a game and a topic, and we'll slot a short lesson between rounds. No account needed — your progress saves on this device."
      />
      <SessionLauncher />
    </div>
  )
}
