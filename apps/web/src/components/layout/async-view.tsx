import type { ReactNode } from 'react'
import { Panel } from '@fw/ui'
import type { AsyncState } from '@/hooks/use-async'

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 font-mono text-xs tracking-widest text-muted-foreground uppercase"
    >
      <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
      {label}…
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <Panel className="py-10 text-center">
      <p className="font-mono text-xs tracking-widest text-primary uppercase">
        Couldn’t load this
      </p>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 border border-border px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase hover:bg-muted"
        >
          Retry
        </button>
      )}
    </Panel>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Panel className="py-10 text-center">
      <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        {message}
      </p>
    </Panel>
  )
}

// Renders loading / error states, then hands the resolved data to `children`.
export function AsyncView<T>({
  state,
  children,
}: {
  state: AsyncState<T> & { reload?: () => void }
  children: (data: T) => ReactNode
}) {
  if (state.loading) return <Loading />
  if (state.error)
    return <ErrorState message={state.error} onRetry={state.reload} />
  if (state.data === null) return null
  return <>{children(state.data)}</>
}
