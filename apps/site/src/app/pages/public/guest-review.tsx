import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/auth-context'
import { ReviewPage } from '@/pages/app/review'

// The guest review queue (/review). Signed-in users go to the account queue,
// which is server-scheduled and survives the device; guests get the same page
// running on localStorage and the same pure scheduler.
export function GuestReview() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/app/review" replace />
  return <ReviewPage guest />
}
