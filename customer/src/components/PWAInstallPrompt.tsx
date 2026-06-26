'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'
import { useStoreState } from '@/stores/use-store-state'

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/downloads/app.apk'

const LS_APK_DOWNLOADED = 'boss_apk_downloaded'
const LS_APK_CHECKED = 'boss_apk_checked_scheme'

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

function checkNativeAppInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    if (sessionStorage.getItem(LS_APK_CHECKED)) {
      resolve(localStorage.getItem(LS_APK_DOWNLOADED) === 'true')
      return
    }
    sessionStorage.setItem(LS_APK_CHECKED, 'true')

    let done = false

    const timeout = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (!done) resolve(false)
    }, 600)

    const onVisibility = () => {
      if (document.hidden) {
        done = true
        clearTimeout(timeout)
        localStorage.setItem(LS_APK_DOWNLOADED, 'true')
        document.removeEventListener('visibilitychange', onVisibility)
        resolve(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    setTimeout(() => {
      if (!done) {
        try { window.location.href = 'bossapp://' } catch { resolve(false) }
      }
    }, 200)
  })
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const { dismissInstallTimeout, setDismissInstallTimeout } = useStoreState()
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showApkPrompt, setShowApkPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [apkReady, setApkReady] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const android = /Android/i.test(ua)
    setIsAndroid(android)

    const appInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (appInstalled) {
      setIsInstalled(true)
      return
    }

    if (!android) return

    const alreadyDownloaded = localStorage.getItem(LS_APK_DOWNLOADED) === 'true'
    if (alreadyDownloaded) {
      setApkReady(true)
      return
    }

    checkNativeAppInstalled().then((installed) => {
      if (!installed) {
        setApkReady(true)
      }
    })
  }, [])

  useEffect(() => {
    if (isAndroid && apkReady && !isInstalled && Date.now() > dismissInstallTimeout) {
      setShowApkPrompt(true)
    }
  }, [isAndroid, apkReady, isInstalled, dismissInstallTimeout])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!isAndroid && !isInstalled) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setShowApkPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isAndroid, isInstalled])

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the PWA prompt')
    }
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDownloadApk = () => {
    localStorage.setItem(LS_APK_DOWNLOADED, 'true')
    setShowApkPrompt(false)
    const a = document.createElement('a')
    a.href = APK_URL
    a.download = 'boss.apk'
    a.click()
  }

  const handleDismiss = () => {
    const ONE_DAY = 24 * 60 * 60 * 1000
    setDismissInstallTimeout(Date.now() + ONE_DAY)
    setShowInstallPrompt(false)
    setShowApkPrompt(false)
  }

  if (isInstalled) return null

  if (!isAndroid && showInstallPrompt && deferredPrompt) {
    return (
      <div
        className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: 'calc(var(--bottomnav-height, 0px) + 1em)' }}
      >
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
                <p className="text-xs text-gray-600 dark:text-gray-300">
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
              onClick={handleInstallPwa}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="px-4">
              Nanti
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isAndroid && showApkPrompt) {
    return (
      <div
        className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: 'calc(var(--bottomnav-height, 0px) + 1em)' }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 rounded-lg p-2">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Download Aplikasi Android
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Dapatkan pengalaman terbaik dengan aplikasi Android BOSS
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
              onClick={handleDownloadApk}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download APK
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="px-4">
              Nanti
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}