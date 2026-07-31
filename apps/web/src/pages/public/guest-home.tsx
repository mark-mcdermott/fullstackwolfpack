import { useState } from 'react'
import { Navigate } from 'react-router'
import { SessionLauncher } from '@/components/launch/session-launcher'
import { HomeHero } from '@/components/home/hero'
import { MissionView } from '@/components/mission/mission-view'
import {
  BuiltForDevs,
  CreedBand,
  HowItWorks,
  ReadyToJoin,
} from '@/components/home/sections'
import { useAuth } from '@/hooks/auth-context'

// The guest front door (`/`): logged-out visitors land here — the session
// launcher in guest mode — instead of being bounced to the marketing site.
// Signed-in users go straight to the app. Rendered under GuestLayout, so it
// carries the guest header/footer + the "sign up to save progress" banner.
//
// Starting a mission morphs the launcher into the in-place "mission in progress"
// view (no page navigation); the Wolfpack shell + CreedBand stay put.
export function GuestHome() {
  const { user, loading } = useAuth()
  const [missionStarted, setMissionStarted] = useState(false)
  if (loading) return null
  if (user) return <Navigate to="/app" replace />

  return (
    <div className="flex flex-col gap-6">
      {missionStarted ? (
        <MissionView onPause={() => setMissionStarted(false)} />
      ) : (
        <>
          <HomeHero />
          <SessionLauncher onStart={() => setMissionStarted(true)} />
        </>
      )}
      <CreedBand />
      {!missionStarted && (
        <>
          <BuiltForDevs />
          <HowItWorks />
          <ReadyToJoin />
        </>
      )}
    </div>
  )
}
