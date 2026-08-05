import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router'
import { SessionLauncher } from '@/components/launch/session-launcher'
import { HomeHero } from '@/components/home/hero'
import {
  DEFAULT_SESSION,
  MissionView,
  type MissionSession,
} from '@/components/mission/mission-view'
import { ResumeMissionCard } from '@/components/mission/resume-mission-card'
import {
  WolfPath,
  CreedBand,
  PathBanner,
  ReadyToJoin,
} from '@/components/home/sections'
import { useAuth } from '@/hooks/auth-context'
import { useTimer } from '@/hooks/timer-context'
import { setMissionExit } from '@/lib/mission-exit-store'
import { clearMission, loadMission, saveMission } from '@/lib/mission-store'
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
  // The paused mission to offer resuming, if any (drives the resume card).
  const [resumable, setResumable] = useState<MissionSession | null>(null)
  // Latest leave handler, so the header brand can exit the mission like the ✕.
  const leaveRef = useRef<() => void>(() => {})

  // Expose the "take a break" handler to chrome outside the page (the header
  // brand) while the mission is on screen; clear it otherwise.
  useEffect(() => {
    if (phase !== 'running') return
    setMissionExit(() => leaveRef.current())
    return () => setMissionExit(null)
  }, [phase])

  // The timer auto-resumes any persisted session on load. Reconcile the mission
  // view with it: mid-mission (running) → drop straight back in; paused ("took a
  // break", or a reloaded paused tab) → offer a resume card on the launcher.
  useEffect(() => {
    if (phase !== 'idle') return
    if (!timer.active) {
      setResumable(null)
      return
    }
    const m = loadMission()
    if (!m) return
    setSession(m)
    if (timer.paused) {
      setResumable(m)
    } else {
      setResumable(null)
      setPhase('running')
    }
  }, [phase, timer.active, timer.paused])

  if (loading) return null
  if (user) return <Navigate to="/app" replace />

  function startMission(next?: MissionSession) {
    const s = next ?? DEFAULT_SESSION
    // Starting fresh ends any paused mission (records it) before the new one.
    if (timer.active) timer.end()
    setResumable(null)
    setSession(s)
    saveMission(s)
    // Set the target the lesson stage reads, and start the real play↔learn timer
    // so the mission bar counts down and 0:00 flips to the learn phase.
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

  // "Take a break" (✕): pause the timer (keep the mission persisted) and
  // reverse-morph home, where a resume card lets you pick right back up.
  function leaveMission() {
    timer.pause()
    setPhase('pausing')
    window.setTimeout(() => {
      setPhase('idle')
      setLauncherEntering(true)
      window.setTimeout(() => setLauncherEntering(false), ENTER_MS)
    }, EXIT_MS)
  }

  // Resume a paused mission from the card — morph back into it where it left off.
  function resumeMission() {
    timer.resume()
    setResumable(null)
    setLauncherEntering(false)
    setPhase('exiting')
    window.setTimeout(() => setPhase('running'), EXIT_MS)
  }

  // End a paused mission for good (records it) and stay on the launcher.
  function discardMission() {
    timer.end()
    clearMission()
    setResumable(null)
  }

  leaveRef.current = leaveMission

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
          <MissionView session={session} onExit={leaveMission} />
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
          {resumable && (
            <ResumeMissionCard
              session={resumable}
              onResume={resumeMission}
              onDiscard={discardMission}
            />
          )}
          <HomeHero />
          <SessionLauncher onStart={startMission} />
        </div>
      )}
      {phase === 'idle' && (
        <>
          <CreedBand />
          <WolfPath />
          <PathBanner />
          <ReadyToJoin />
        </>
      )}
    </div>
  )
}
