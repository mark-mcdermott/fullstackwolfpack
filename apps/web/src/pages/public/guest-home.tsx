import { useState } from 'react'
import { Navigate } from 'react-router'
import { SessionLauncher } from '@/components/launch/session-launcher'
import { HomeHero } from '@/components/home/hero'
import {
  DEFAULT_SESSION,
  MissionView,
  type MissionSession,
} from '@/components/mission/mission-view'
import {
  BuiltForDevs,
  CreedBand,
  HowItWorks,
  ReadyToJoin,
} from '@/components/home/sections'
import { useAuth } from '@/hooks/auth-context'
import { useTimer } from '@/hooks/timer-context'
import { setSessionTarget } from '@/lib/session-target'
import { cn } from '@/lib/utils'

// Start: idle → exiting (launcher slides up + fades) → running (mission rises in).
// Pause: running → pausing (mission slides down + fades) → idle (launcher drops
// back in from the top). `launcherEntering` gates that re-entry so the launcher
// only animates back after a pause, never on first load.
type Phase = 'idle' | 'exiting' | 'running' | 'pausing'
const EXIT_MS = 460
const ENTER_MS = 500

// The guest front door (`/`): logged-out visitors land here — the session
// launcher in guest mode — instead of being bounced to the marketing site.
// Signed-in users go straight to the app. Rendered under GuestLayout, so it
// carries the guest header/footer + the "sign up to save progress" banner.
//
// Starting a mission MORPHS the launcher into the in-place "mission in progress"
// view (no page navigation); Pause reverses it. The launcher hands over the
// chosen session; the hero's quick-start uses the defaults.
export function GuestHome() {
  const { user, loading } = useAuth()
  const timer = useTimer()
  const [phase, setPhase] = useState<Phase>('idle')
  const [launcherEntering, setLauncherEntering] = useState(false)
  const [session, setSession] = useState<MissionSession>(DEFAULT_SESSION)
  if (loading) return null
  if (user) return <Navigate to="/app" replace />

  function startMission(next?: MissionSession) {
    const s = next ?? DEFAULT_SESSION
    setSession(s)
    // Set the target the lesson overlay reads, and start the real play↔learn
    // timer so the mission bar counts down and 0:00 flips to the learn phase.
    setSessionTarget({ gameId: s.gameId, topicSlug: s.topicSlug })
    timer.start({
      playMinutes: s.playMinutes,
      learnMinutes: s.learnMinutes,
      rounds: 3,
      startPhase: s.learnFirst ? 'learn' : 'play',
      loop: true,
    })
    setLauncherEntering(false)
    setPhase('exiting')
    window.setTimeout(() => setPhase('running'), EXIT_MS)
  }

  // End the mission (records the session) and reverse-morph back to the launcher.
  // In-mission Pause/Resume is handled in place by the mission bar — this is the
  // way *out*.
  function exitMission() {
    timer.end()
    setPhase('pausing')
    window.setTimeout(() => {
      setPhase('idle')
      setLauncherEntering(true)
      window.setTimeout(() => setLauncherEntering(false), ENTER_MS)
    }, EXIT_MS)
  }

  const showMission = phase === 'running' || phase === 'pausing'

  return (
    <div className="flex flex-col gap-6">
      {showMission ? (
        <div
          className={cn(
            phase === 'pausing'
              ? 'animate-out fade-out slide-out-to-bottom-6 fill-mode-forwards duration-[460ms]'
              : 'animate-in fade-in slide-in-from-bottom-4 duration-500',
          )}
        >
          <MissionView session={session} onExit={exitMission} />
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-6',
            phase === 'exiting' &&
              'animate-out fade-out slide-out-to-top-6 fill-mode-forwards duration-[460ms]',
            launcherEntering &&
              'animate-in fade-in slide-in-from-top-6 duration-500',
          )}
        >
          <HomeHero onStart={startMission} />
          <SessionLauncher onStart={startMission} />
        </div>
      )}
      {phase === 'idle' && (
        <>
          <CreedBand />
          <BuiltForDevs />
          <HowItWorks />
          <ReadyToJoin />
        </>
      )}
    </div>
  )
}
