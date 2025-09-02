import { Suspense } from 'react'
import ProfileSettings from '@/components/profile/ProfileSettings'
import { LoadingState } from '@/components/Base'

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading profile..." />}>
      <ProfileSettings />
    </Suspense>
  )
}
