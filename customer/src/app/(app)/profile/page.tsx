'use client'

import { Suspense, useEffect } from 'react'
import ProfileSettings from '@/components/profile/ProfileSettings'
import { LoadingState } from '@/components/Base'

export default function ProfilePage() {
  useEffect(() => {
    document.title = 'Profile'
  }, [])
  return (
    <Suspense fallback={<LoadingState message="Loading profile..." />}>
      <ProfileSettings />
    </Suspense>
  )
}
