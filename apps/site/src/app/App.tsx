import { Route, Routes } from 'react-router'
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
import { GuestLearn } from '@/pages/public/guest-learn'
import { LearnBrowse } from '@/pages/public/learn-browse'
import { AdminUsersPage } from '@/pages/admin/users'
import { SignInPage } from '@/pages/auth/sign-in'
import { SignUpPage } from '@/pages/auth/sign-up'
import { NotFound } from '@/pages/not-found'

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthChromeLayout />}>
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      {/* Public (guest) — the app IS the front door. `/` lands guests on the
          launcher (signed-in → /app); no marketing bounce. No RequireAuth. */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<GuestHome />} />
        <Route path="/play" element={<ArcadePage />} />
        <Route path="/learn" element={<LearnBrowse />} />
        <Route path="/learn/:lessonId" element={<GuestLearn />} />
        <Route path="/leaderboard" element={<GuestLeaderboard />} />
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
