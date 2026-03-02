import { Suspense } from 'react'
import ProfileSettings from '@/components/profile/ProfileSettings'
import { LoadingState } from '@/components/Base'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile'
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading profile..." />}>
      <ProfileSettings />
    </Suspense>
  )
}
