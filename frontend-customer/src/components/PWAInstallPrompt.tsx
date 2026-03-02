'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone === true

    if (isStandalone || (isIOS && isInStandaloneMode)) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()

      // Stash the event so it can be triggered later
      setDeferredPrompt(e)

      // Show our custom install prompt
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt')
    } else {
      console.log('User dismissed the A2HS prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div
      className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      style={{
        bottom: "calc(var(--bottomnav-height, 0px) + 1em)",
      }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 rounded-lg p-2">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Install BOSS App
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Install untuk akses yang lebih cepat
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="px-4"
          >
            Nanti
          </Button>
        </div>
      </div>
    </div>
  )
}