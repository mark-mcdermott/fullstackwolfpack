import { Navigate, Route, Routes, useLocation, useParams } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthChromeLayout } from '@/components/layout/auth-chrome-layout'
import { GuestLayout } from '@/components/layout/guest-layout'
import { RequireAuth, RequireRole } from '@/components/layout/guards'
import { AchievementsPage } from '@/pages/app/achievements'
import { ArcadePage } from '@/pages/app/arcade'
import { BadgesPage } from '@/pages/app/badges'
import { CreditsPage } from '@/pages/app/credits'
import { DashboardPage } from '@/pages/app/dashboard'
import { FriendsPage } from '@/pages/app/friends'
import { LeaderboardPage } from '@/pages/app/leaderboard'
import { LearnPage } from '@/pages/app/learn'
import { ProgressPage } from '@/pages/app/progress'
import { ReviewPage } from '@/pages/app/review'
import { SessionsPage } from '@/pages/app/sessions'
import { SettingsPage } from '@/pages/app/settings'
import { StatsPage } from '@/pages/app/stats'
import { TopicSettingsPage } from '@/pages/app/topic-settings'
import { TopicsPage } from '@/pages/app/topics'
import { GuestHome } from '@/pages/public/guest-home'
import { GuestLeaderboard } from '@/pages/public/guest-leaderboard'
import { GlossaryPage } from '@/pages/public/glossary'
import { GuestLearn } from '@/pages/public/guest-learn'
import { GuestReview } from '@/pages/public/guest-review'
import { LearnBrowse } from '@/pages/public/learn-browse'
import { AdminUsersPage } from '@/pages/admin/users'
import { SignInPage } from '@/pages/auth/sign-in'
import { ResetPasswordPage } from '@/pages/auth/reset-password'
import { SignUpPage } from '@/pages/auth/sign-up'
import { NotFound } from '@/pages/not-found'

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthChromeLayout />}>
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Public (guest) — the interactive core-loop launcher + try-before-signup
          surfaces. The launcher is now the site root: there is no index.astro,
          so `/` falls through to the applet catch-all and lands here. `/start`
          is kept as an alias so existing links and CTAs still work. The old
          marketing landing is parked at `/welcome`. No RequireAuth. */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<GuestHome />} />
        <Route path="/start" element={<GuestHome />} />
        <Route path="/play" element={<ArcadePage />} />
        {/* The browse page answers to both. `/javascript` is what the nav
            points at while JavaScript is the only topic; `/skill` stays so
            existing links, the in-app back-links and any shared URLs keep
            working — and so the name can go back to a category later without
            another rename. */}
        <Route path="/javascript" element={<LearnBrowse />} />
        <Route path="/skill" element={<LearnBrowse />} />
        <Route path="/javascript/:lessonId" element={<GuestLearn />} />
        {/* Legacy: lessons lived here before the topic got its own path. Kept
            so shared links keep working. */}
        <Route path="/skill/:lessonId" element={<GuestLearn />} />
        {/* Public on purpose: a term's page is where "read more" lands from a
            lesson a guest can already read, and it is a URL worth sharing. */}
        <Route path="/glossary/:slug" element={<GlossaryPage />} />
        <Route path="/leaderboard" element={<GuestLeaderboard />} />
        {/* Spaced repetition without an account — cards live in localStorage
            and the scheduler is the same pure core/review the server uses. */}
        <Route path="/review" element={<GuestReview />} />
      </Route>

      {/* Private */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/sessions" element={<SessionsPage />} />
          <Route path="/app/arcade" element={<ArcadePage />} />
          <Route path="/app/friends" element={<FriendsPage />} />
          <Route path="/app/credits" element={<CreditsPage />} />
          <Route path="/app/topics" element={<TopicsPage />} />
          <Route
            path="/app/topics/:slug/settings"
            element={<TopicSettingsPage />}
          />
          <Route path="/app/learn/:lessonId" element={<LearnPage />} />
          <Route path="/app/review" element={<ReviewPage />} />
          <Route path="/app/progress" element={<ProgressPage />} />
          <Route path="/app/stats" element={<StatsPage />} />
          <Route path="/app/achievements" element={<AchievementsPage />} />
          <Route path="/app/badges" element={<BadgesPage />} />
          <Route path="/app/leaderboard" element={<LeaderboardPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>

        {/* Admin */}
        <Route element={<RequireRole ability="admin.access" />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* `/learn` became `/skill`, then `/javascript`. A redirect rather than an
          alias, so the
          rename leaves one canonical URL behind it — but old links, bookmarks
          and any shared lesson URL still land. Outside GuestLayout on purpose:
          nothing should paint on the way through. */}
      <Route path="/learn" element={<LegacySkillRedirect />} />
      <Route path="/learn/:lessonId" element={<LegacySkillRedirect />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// Carries the lesson id and the query across, since `/learn?topic=` was a real
// link on the browse page and `/learn/:id` was every shared lesson URL.
function LegacySkillRedirect() {
  const { lessonId } = useParams()
  const { search } = useLocation()
  return (
    <Navigate
      to={`/javascript${lessonId ? `/${lessonId}` : ''}${search}`}
      replace
    />
  )
}

export default App
