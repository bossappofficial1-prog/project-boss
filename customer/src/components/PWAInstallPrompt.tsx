'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'
import { useStoreState } from '@/stores/use-store-state'

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/downloads/app.apk'
const LS_APK_INSTALLED = 'boss_apk_installed'

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
  const [showPwaPrompt, setShowPwaPrompt] = useState(false)
  const [showApkPrompt, setShowApkPrompt] = useState(false)
  const [isPwaInstalled, setIsPwaInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  const { dismissInstallTimeout, setDismissInstallTimeout } = useStoreState()
  const isAndroidRef = useRef(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const android = /Android/i.test(ua)
    isAndroidRef.current = android
    setIsAndroid(android)

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (standalone) {
      setIsPwaInstalled(true)
    }
  }, [])

  useEffect(() => {
    if (!isAndroid || isPwaInstalled) return
    if (localStorage.getItem(LS_APK_INSTALLED) === 'true') return

    if (sessionStorage.getItem('bossapp_scheme_tried')) return
    sessionStorage.setItem('bossapp_scheme_tried', 'true')

    const onHidden = () => {
      if (document.hidden) {
        localStorage.setItem(LS_APK_INSTALLED, 'true')
        document.removeEventListener('visibilitychange', onHidden)
        window.removeEventListener('pagehide', onPageHide)
      }
    }

    const onPageHide = () => {
      localStorage.setItem(LS_APK_INSTALLED, 'true')
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onPageHide)
    }

    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onPageHide)

    setTimeout(() => {
      try { window.location.href = 'bossapp://' } catch { /* ignore */ }
    }, 200)

    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [isAndroid, isPwaInstalled])

  useEffect(() => {
    if (
      isAndroid &&
      !isPwaInstalled &&
      localStorage.getItem(LS_APK_INSTALLED) !== 'true' &&
      Date.now() > dismissInstallTimeout
    ) {
      setShowApkPrompt(true)
    } else {
      setShowApkPrompt(false)
    }
  }, [isAndroid, isPwaInstalled, dismissInstallTimeout])

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!isAndroidRef.current && !isPwaInstalled) {
        setShowPwaPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsPwaInstalled(true)
      setShowPwaPrompt(false)
      setShowApkPrompt(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isPwaInstalled])

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('PWA installed')
    }
    setDeferredPrompt(null)
    setShowPwaPrompt(false)
  }

  const handleDownloadApk = () => {
    localStorage.setItem(LS_APK_INSTALLED, 'true')
    setShowApkPrompt(false)
    const a = document.createElement('a')
    a.href = APK_URL
    a.download = 'boss.apk'
    a.click()
  }

  const handleDismiss = () => {
    setDismissInstallTimeout(Date.now() + 86400000)
    setShowPwaPrompt(false)
    setShowApkPrompt(false)
  }

  if (isPwaInstalled) return null

  if (!isAndroid && showPwaPrompt && deferredPrompt) {
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

  return null
}
