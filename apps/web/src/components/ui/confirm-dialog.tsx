import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Accessible confirm dialog built on base-ui's AlertDialog (focus-trapped, no
// outside-click dismiss — the right semantics for a destructive confirm), styled
// to the FW-01 look. Controlled via open/onOpenChange so the caller owns state.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-border bg-card p-6 shadow-lg outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <AlertDialog.Title className="font-mono text-xs tracking-widest uppercase">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Close
              disabled={busy}
              className="border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </AlertDialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={cn(
                'px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                destructive
                  ? 'border border-destructive text-destructive hover:bg-destructive/10'
                  : 'bg-primary text-primary-foreground hover:bg-primary/80',
              )}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
