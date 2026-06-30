import { Outlet } from 'react-router'
import { MarketingHeader } from './marketing-header'
import { SiteFooter } from './site-footer'

export function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
