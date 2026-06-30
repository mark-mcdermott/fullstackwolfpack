import { Outlet } from 'react-router'
import { AppHeader } from './app-header'
import { Sidebar } from './sidebar'
import { SiteFooter } from './site-footer'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-5">
            <Outlet />
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
