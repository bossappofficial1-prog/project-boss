'use client'

import { useEffect } from 'react'

export default function VerifyInstallPage() {
  useEffect(() => {
    window.location.replace('/?app_not_found=1')
  }, [])

  return null
}
