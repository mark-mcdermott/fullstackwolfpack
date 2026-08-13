import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { api } from '@/api-client'
import { can } from '@/core/access'
import { useAuth } from '@/hooks/auth-context'
import { guestDueReviews } from '@/lib/guest-review'

// How many reviews are due right now, for the nav badge.
//
// The two sides cost very different amounts, so they are polled differently.
//
// A guest's queue is a localStorage read — free and synchronous — and it can
// become non-empty while they sit on a page, because a missed card comes back
// in ten minutes. So it is recomputed on navigation and on a slow timer.
//
// An account's queue is a request, so it is fetched on mount and on navigation
// only, never on a timer. A badge is not worth a poll.
const GUEST_POLL_MS = 60_000

export function useDueReviewCount(): number {
  const { user } = useAuth()
  const location = useLocation()
  const [count, setCount] = useState(0)

  // Signed-in users who cannot open the queue must not be badged toward it —
  // the page is Pro-gated, so a badge would be an invitation to an upsell.
  const gated = !!user && !can(user, 'feature.smart_intervals')

  useEffect(() => {
    if (gated) {
      setCount(0)
      return
    }

    if (!user) {
      const read = () => setCount(guestDueReviews().dueCount)
      read()
      const id = setInterval(read, GUEST_POLL_MS)
      return () => clearInterval(id)
    }

    let active = true
    api.data
      .reviews()
      .then((q) => active && setCount(q.dueCount))
      .catch(() => {
        /* a badge is not worth surfacing an error for */
      })
    return () => {
      active = false
    }
  }, [user, gated, location.pathname])

  return count
}
