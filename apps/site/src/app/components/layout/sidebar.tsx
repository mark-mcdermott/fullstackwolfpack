import { SidebarContent } from './sidebar-content'

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-5 border-r border-border p-5 lg:flex">
      <SidebarContent />
    </aside>
  )
}
