import { Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth, RequireRole } from '@/components/layout/guards'
import { MarketingLayout } from '@/components/layout/marketing-layout'
import { AchievementsPage } from '@/pages/app/achievements'
import { ArcadePage } from '@/pages/app/arcade'
import { BadgesPage } from '@/pages/app/badges'
import { DashboardPage } from '@/pages/app/dashboard'
import { LearnPage } from '@/pages/app/learn'
import { ProgressPage } from '@/pages/app/progress'
import { SessionsPage } from '@/pages/app/sessions'
import { SettingsPage } from '@/pages/app/settings'
import { StatsPage } from '@/pages/app/stats'
import { TopicsPage } from '@/pages/app/topics'
import { AdminUsersPage } from '@/pages/admin/users'
import { AuthPage } from '@/pages/auth-page'
import { NotFound } from '@/pages/not-found'
import { About } from '@/pages/public/about'
import { Blog } from '@/pages/public/blog'
import { Features } from '@/pages/public/features'
import { Home } from '@/pages/public/home'
import { HowItWorks } from '@/pages/public/how-it-works'
import { Pricing } from '@/pages/public/pricing'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />

      {/* Private */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/sessions" element={<SessionsPage />} />
          <Route path="/app/arcade" element={<ArcadePage />} />
          <Route path="/app/topics" element={<TopicsPage />} />
          <Route path="/app/learn/:lessonId" element={<LearnPage />} />
          <Route path="/app/progress" element={<ProgressPage />} />
          <Route path="/app/stats" element={<StatsPage />} />
          <Route path="/app/achievements" element={<AchievementsPage />} />
          <Route path="/app/badges" element={<BadgesPage />} />
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
