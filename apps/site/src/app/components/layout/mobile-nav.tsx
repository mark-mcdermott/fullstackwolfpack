import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SidebarContent } from './sidebar-content'

// The app's primary navigation for < lg screens, where the Sidebar is hidden.
// A hamburger opens a slide-in drawer with the exact same body as the desktop
// sidebar; tapping the backdrop, pressing Escape, or picking a link closes it.
export function MobileNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex size-9 items-center justify-center border border-border text-muted-foreground hover:text-foreground"
      >
        <Menu className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-60 max-w-[85%] flex-col gap-5 overflow-y-auto border-r border-border bg-background p-5">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  )
}
