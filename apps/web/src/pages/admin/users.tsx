import { useState } from 'react'
import { api } from '@/api-client'
import { AsyncView } from '@/components/layout/async-view'
import { PageHeading, Panel } from '@/components/ui-kit'
import type { AdminUser } from '@/core/app-data'
import { useAsync } from '@/hooks/use-async'
import { cn } from '@/lib/utils'

export function AdminUsersPage() {
  const state = useAsync(() => api.admin.users())
  return (
    <div>
      <PageHeading
        label="Admin"
        title="Users"
        subtitle="Manage roles and subscription tiers."
      />
      <AsyncView state={state}>
        {(users) => <UsersTable initial={users} />}
      </AsyncView>
    </div>
  )
}

function UsersTable({ initial }: { initial: AdminUser[] }) {
  const [rows, setRows] = useState<AdminUser[]>(initial)
  const [error, setError] = useState<string | null>(null)

  async function toggle(id: string, field: 'role' | 'tier') {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const patch: { role?: 'user' | 'admin'; tier?: 'free' | 'pro' } =
      field === 'role'
        ? { role: row.role === 'admin' ? 'user' : 'admin' }
        : { tier: row.tier === 'pro' ? 'free' : 'pro' }

    setError(null)
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    try {
      await api.admin.updateUser(id, patch)
    } catch {
      setRows(initial)
      setError('Update failed — reverted.')
    }
  }

  if (rows.length === 0) {
    return (
      <Panel>
        <p className="font-mono text-[10px] text-muted-foreground">
          No users yet.
        </p>
      </Panel>
    )
  }

  return (
    <Panel className="overflow-x-auto">
      {error && (
        <p className="mb-3 font-mono text-[10px] text-destructive">{error}</p>
      )}
      <table className="w-full text-left">
        <thead>
          <tr className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            <th className="pb-3">User</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Tier</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="text-sm">
              <td className="py-3">
                <p className="font-medium">{r.displayName}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {r.email}
                </p>
              </td>
              <td className="py-3">
                <span
                  className={cn(
                    'font-mono text-[10px] tracking-widest uppercase',
                    r.role === 'admin'
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {r.role}
                </span>
              </td>
              <td className="py-3">
                <span
                  className={cn(
                    'font-mono text-[10px] tracking-widest uppercase',
                    r.tier === 'pro' ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {r.tier}
                </span>
              </td>
              <td className="py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggle(r.id, 'role')}
                  className="mr-2 border border-border px-2 py-1 font-mono text-[10px] tracking-widest uppercase hover:bg-muted"
                >
                  Toggle role
                </button>
                <button
                  type="button"
                  onClick={() => toggle(r.id, 'tier')}
                  className="border border-border px-2 py-1 font-mono text-[10px] tracking-widest uppercase hover:bg-muted"
                >
                  Toggle tier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}
