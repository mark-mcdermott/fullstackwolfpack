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
import { cn } from '@/lib/utils'

// idle → exiting (launcher slides up + fades) → running (mission rises + fades in).
type Phase = 'idle' | 'exiting' | 'running'
const EXIT_MS = 460

// The guest front door (`/`): logged-out visitors land here — the session
// launcher in guest mode — instead of being bounced to the marketing site.
// Signed-in users go straight to the app. Rendered under GuestLayout, so it
// carries the guest header/footer + the "sign up to save progress" banner.
//
// Starting a mission MORPHS the launcher into the in-place "mission in progress"
// view (no page navigation): the launcher slides up and fades, then the mission
// view rises and fades in. The Wolfpack shell + CreedBand stay put.
export function GuestHome() {
  const { user, loading } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  if (loading) return null
  if (user) return <Navigate to="/app" replace />

  function startMission() {
    setPhase('exiting')
    window.setTimeout(() => setPhase('running'), EXIT_MS)
  }

  return (
    <div className="flex flex-col gap-6">
      {phase === 'running' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MissionView onPause={() => setPhase('idle')} />
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-6',
            phase === 'exiting' &&
              'animate-out fade-out slide-out-to-top-6 fill-mode-forwards duration-[460ms]',
          )}
        >
          <HomeHero onStart={startMission} />
          <SessionLauncher onStart={startMission} />
        </div>
      )}
      <CreedBand />
      {phase === 'idle' && (
        <>
          <BuiltForDevs />
          <HowItWorks />
          <ReadyToJoin />
        </>
      )}
    </div>
  )
}
