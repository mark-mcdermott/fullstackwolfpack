import { useState } from 'react'
import { PageHeading, Panel } from '@/components/ui-kit'
import type { Role, Tier } from '@/core/access'
import { cn } from '@/lib/utils'

type Row = { name: string; email: string; role: Role; tier: Tier }

const SEED: Row[] = [
  { name: 'Mark McDermott', email: 'mark@fullstackwolfpack.dev', role: 'admin', tier: 'pro' },
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'user', tier: 'pro' },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'user', tier: 'free' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'user', tier: 'free' },
]

export function AdminUsersPage() {
  // Local stub — real version would PATCH the user and refetch.
  const [rows, setRows] = useState<Row[]>(SEED)

  function toggle(email: string, field: 'role' | 'tier') {
    setRows((rs) =>
      rs.map((r) =>
        r.email !== email
          ? r
          : field === 'role'
            ? { ...r, role: r.role === 'admin' ? 'user' : 'admin' }
            : { ...r, tier: r.tier === 'pro' ? 'free' : 'pro' },
      ),
    )
  }

  return (
    <div>
      <PageHeading
        label="Admin"
        title="Users"
        subtitle="Manage roles and subscription tiers."
      />
      <Panel className="overflow-x-auto">
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
              <tr key={r.email} className="text-sm">
                <td className="py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {r.email}
                  </p>
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      'font-mono text-[10px] tracking-widest uppercase',
                      r.role === 'admin' ? 'text-primary' : 'text-muted-foreground',
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
                    onClick={() => toggle(r.email, 'role')}
                    className="mr-2 border border-border px-2 py-1 font-mono text-[10px] tracking-widest uppercase hover:bg-muted"
                  >
                    Toggle role
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(r.email, 'tier')}
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
    </div>
  )
}
