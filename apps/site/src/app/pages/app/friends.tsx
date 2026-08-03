import { Check, Circle, Search, Send, UserPlus, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api-client'
import { PageHeading, Panel, SectionLabel } from '@fw/ui'
import type {
  Conversation,
  Friend,
  FriendsView,
  UserSearchResult,
} from '@/core/social'
import { useAuth } from '@/hooks/auth-context'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

// Poll cadence. When realtime is connected, polling drops to a slow safety net
// (realtime carries the instant updates); otherwise it's the primary channel.
const FRIENDS_POLL_MS = { live: 30_000, poll: 10_000 }
const CONVO_POLL_MS = { live: 15_000, poll: 4_000 }

function relativeSeen(iso: string | null): string {
  if (!iso) return 'never seen'
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'active now'
  if (secs < 3600) return `active ${Math.floor(secs / 60)}m ago`
  if (secs < 86_400) return `active ${Math.floor(secs / 3600)}h ago`
  return `active ${Math.floor(secs / 86_400)}d ago`
}

function PresenceDot({ online }: { online: boolean }) {
  return (
    <Circle
      className={cn(
        'size-2.5 shrink-0',
        online ? 'fill-emerald-500 text-emerald-500' : 'fill-muted text-muted',
      )}
    />
  )
}

export function FriendsPage() {
  const { user } = useAuth()
  const [view, setView] = useState<FriendsView | null>(null)
  const [selected, setSelected] = useState<Friend | null>(null)
  const [rtNudge, setRtNudge] = useState(0)

  const loadFriends = useCallback(async () => {
    try {
      setView(await api.social.friends())
    } catch {
      /* keep last view on a transient error */
    }
  }, [])

  // Realtime: any DM event refreshes the friends view (unread badges) and nudges
  // the open conversation to reload; `online` is the live presence set. Falls
  // back to polling + lastActiveAt when not connected.
  const { connected: live, online } = useRealtime(
    user?.id,
    useCallback(() => {
      loadFriends()
      setRtNudge((n) => n + 1)
    }, [loadFriends]),
  )

  useEffect(() => {
    loadFriends()
    const t = setInterval(loadFriends, live ? FRIENDS_POLL_MS.live : FRIENDS_POLL_MS.poll)
    return () => clearInterval(t)
  }, [loadFriends, live])

  return (
    <div>
      <PageHeading
        label="Community"
        title="Friends"
        subtitle="Add friends, see who's learning now, and chat between sessions."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <AddFriends onChanged={loadFriends} />
          <Requests view={view} onChanged={loadFriends} />
          <FriendList
            view={view}
            selectedId={selected?.userId ?? null}
            onSelect={setSelected}
            live={live}
            online={online}
          />
        </div>
        <ChatPane
          friend={selected}
          onSent={loadFriends}
          live={live}
          online={online}
          nudge={rtNudge}
        />
      </div>
    </div>
  )
}

function AddFriends({ onChanged }: { onChanged: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    let active = true
    const t = setTimeout(async () => {
      try {
        const r = await api.social.findUsers(q)
        if (active) setResults(r.results)
      } catch {
        /* ignore */
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [q])

  async function add(userId: string) {
    await api.social.requestFriend(userId)
    setResults((rs) =>
      rs.map((r) => (r.userId === userId ? { ...r, relation: 'outgoing' } : r)),
    )
    onChanged()
  }

  return (
    <Panel>
      <SectionLabel>Add friends</SectionLabel>
      <div className="mt-3 flex items-center gap-2 border border-border px-3 py-2">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or username"
          className="flex-1 bg-transparent text-sm outline-none"
          aria-label="Search people"
        />
      </div>
      {results.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {results.map((r) => (
            <li key={r.userId} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {r.displayName}
                {r.username && (
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                    @{r.username}
                  </span>
                )}
              </span>
              {r.relation === 'none' ? (
                <button
                  type="button"
                  onClick={() => add(r.userId)}
                  className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-[10px] tracking-widest uppercase hover:border-muted-foreground"
                >
                  <UserPlus className="size-3" /> Add
                </button>
              ) : (
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  {r.relation === 'friends' ? 'Friends' : r.relation}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function Requests({
  view,
  onChanged,
}: {
  view: FriendsView | null
  onChanged: () => void
}) {
  if (!view || view.incoming.length + view.outgoing.length === 0) return null

  async function respond(id: string, action: 'accept' | 'decline') {
    await api.social.respondFriend(id, action)
    onChanged()
  }

  return (
    <Panel>
      <SectionLabel>Requests</SectionLabel>
      <ul className="mt-3 flex flex-col gap-2">
        {view.incoming.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{r.displayName}</span>
            <button
              type="button"
              onClick={() => respond(r.id, 'accept')}
              aria-label="Accept"
              className="flex size-7 items-center justify-center border border-primary text-primary hover:bg-primary/10"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => respond(r.id, 'decline')}
              aria-label="Decline"
              className="flex size-7 items-center justify-center border border-border text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {view.outgoing.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {r.displayName}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Pending
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

// Effective online status: the live presence set when realtime is connected,
// else the polled lastActiveAt-derived flag.
function isUp(f: Friend, live: boolean, online: Set<string>): boolean {
  return live ? online.has(f.userId) : f.online
}

function FriendList({
  view,
  selectedId,
  onSelect,
  live,
  online,
}: {
  view: FriendsView | null
  selectedId: string | null
  onSelect: (f: Friend) => void
  live: boolean
  online: Set<string>
}) {
  return (
    <Panel>
      <SectionLabel>Friends</SectionLabel>
      {!view ? (
        <p className="mt-3 font-mono text-[10px] text-muted-foreground">Loading…</p>
      ) : view.friends.length === 0 ? (
        <p className="mt-3 font-mono text-[10px] text-muted-foreground">
          No friends yet — search above to add someone.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {view.friends.map((f) => {
            const up = isUp(f, live, online)
            return (
            <li key={f.userId}>
              <button
                type="button"
                onClick={() => onSelect(f)}
                className={cn(
                  'flex w-full items-center gap-3 px-2 py-2 text-left text-sm hover:bg-muted',
                  selectedId === f.userId && 'bg-primary/10',
                )}
              >
                <PresenceDot online={up} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{f.displayName}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {up ? 'online' : relativeSeen(f.lastActiveAt)}
                  </span>
                </span>
                {f.unread > 0 && (
                  <span className="flex size-5 items-center justify-center bg-primary font-mono text-[10px] text-primary-foreground">
                    {f.unread}
                  </span>
                )}
              </button>
            </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function ChatPane({
  friend,
  onSent,
  live,
  online,
  nudge,
}: {
  friend: Friend | null
  onSent: () => void
  live: boolean
  online: Set<string>
  nudge: number
}) {
  const [convo, setConvo] = useState<Conversation | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!friend) return
    try {
      const c = await api.social.conversation(friend.userId)
      setConvo(c)
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
      )
    } catch {
      /* ignore */
    }
  }, [friend])

  useEffect(() => {
    setConvo(null)
    if (!friend) return
    load()
    const t = setInterval(load, live ? CONVO_POLL_MS.live : CONVO_POLL_MS.poll)
    return () => clearInterval(t)
  }, [friend, load, live])

  // Realtime nudge — reload the open conversation without clearing it first.
  useEffect(() => {
    if (nudge > 0 && friend) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudge])

  async function send() {
    const body = draft.trim()
    if (!body || !friend || sending) return
    setSending(true)
    setDraft('')
    try {
      await api.social.sendMessage(friend.userId, body)
      await load()
      onSent()
    } catch {
      setDraft(body) // restore on failure
    } finally {
      setSending(false)
    }
  }

  if (!friend) {
    return (
      <Panel className="flex min-h-[24rem] items-center justify-center">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Select a friend to start chatting
        </p>
      </Panel>
    )
  }

  return (
    <Panel className="flex min-h-[24rem] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <PresenceDot online={isUp(friend, live, online)} />
        <span className="text-sm font-semibold">{friend.displayName}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {isUp(friend, live, online)
            ? 'online'
            : relativeSeen(friend.lastActiveAt)}
        </span>
        {live && (
          <span
            title="Realtime connected"
            className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-emerald-500 uppercase"
          >
            <Zap className="size-3 fill-emerald-500" /> Live
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {!convo ? (
          <p className="font-mono text-[10px] text-muted-foreground">Loading…</p>
        ) : convo.messages.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground">
            No messages yet — say hello.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {convo.messages.map((m) => (
              <li
                key={m.id}
                className={cn('flex', m.fromMe ? 'justify-end' : 'justify-start')}
              >
                <span
                  className={cn(
                    'max-w-[75%] whitespace-pre-wrap break-words px-3 py-2 text-sm',
                    m.fromMe
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border',
                  )}
                >
                  {m.body}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 border border-border bg-transparent px-3 py-2 text-sm outline-none"
          aria-label="Message"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !draft.trim()}
          aria-label="Send"
          className="flex size-9 items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
    </Panel>
  )
}
