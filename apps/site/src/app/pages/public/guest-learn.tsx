import { Navigate, useParams } from 'react-router'
import { useAuth } from '@/hooks/auth-context'
import { LearnPage } from '@/pages/app/learn'

// The guest lesson player (/skill/:lessonId). Signed-in users are redirected to
// the account player (/app/learn/:lessonId) so they get real, synced progress;
// guests get the same player in guest mode (public reads + localStorage).
export function GuestLearn() {
  const { user, loading } = useAuth()
  const { lessonId = '' } = useParams()
  if (loading) return null
  if (user) return <Navigate to={`/app/learn/${lessonId}`} replace />
  return <LearnPage guest />
}
