'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export default function OnlineStatusIndicator() {
  const { isOnline } = usePWA()
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setShowOfflineMessage(true)
      setWasOffline(true)
    } else if (isOnline && wasOffline) {
      setShowOfflineMessage(true)
      setWasOffline(false)

      // Hide message after 3 seconds when back online
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  if (!showOfflineMessage) return null

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${isOnline
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white'
        }`}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Koneksi kembali normal' : 'Tidak ada koneksi internet'}
        </span>
      </div>
    </div>
  )
}