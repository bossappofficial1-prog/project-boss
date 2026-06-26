'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone, ExternalLink } from 'lucide-react'
import { useStoreState } from '@/stores/use-store-state'

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || '/downloads/app.apk'
const LS_APK_INSTALLED = 'boss_apk_installed'
const ANDROID_DISMISS_UNTIL = 'boss_android_dismiss_until'
const ANDROID_DISMISS_MS = 15 * 60 * 1000

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
  const [isPwaInstalled, setIsPwaInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [nativeAppFound, setNativeAppFound] = useState(false)
  const [dismissed, setDismissed] = useState(false)

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
      return
    }

    if (!android) return

    const dismissUntil = localStorage.getItem(ANDROID_DISMISS_UNTIL)
    if (dismissUntil && Date.now() < Number(dismissUntil)) {
      setDismissed(true)
    } else {
      localStorage.removeItem(ANDROID_DISMISS_UNTIL)
    }

    const cached = localStorage.getItem(LS_APK_INSTALLED)
    if (cached === 'true') {
      setNativeAppFound(true)
      return
    }

    if (sessionStorage.getItem('bossapp_detected')) return
    sessionStorage.setItem('bossapp_detected', 'true')

    const onPageHide = () => {
      localStorage.setItem(LS_APK_INSTALLED, 'true')
      setNativeAppFound(true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }

    const onVisibility = () => {
      if (document.hidden) onPageHide()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    setTimeout(() => {
      try {
        window.location.href = window.location.origin + '/verify-install'
      } catch { /* ignore */ }
    }, 200)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])

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
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsPwaInstalled(true)
    }
    setDeferredPrompt(null)
    setShowPwaPrompt(false)
  }

  const handleDownloadApk = () => {
    const a = document.createElement('a')
    a.href = APK_URL
    a.download = 'boss.apk'
    a.click()
  }

  const handleOpenApp = () => {
    try {
      window.location.href = window.location.origin + '/verify-install'
    } catch { /* ignore */ }
  }

  const handleDismissAndroid = () => {
    const until = Date.now() + ANDROID_DISMISS_MS
    localStorage.setItem(ANDROID_DISMISS_UNTIL, String(until))
    setDismissed(true)
    setTimeout(() => setDismissed(false), ANDROID_DISMISS_MS)
  }

  const handleDismissPwa = () => {
    setDismissInstallTimeout(Date.now() + 86400000)
    setShowPwaPrompt(false)
  }

  if (isPwaInstalled) return null

  if (!isAndroid && showPwaPrompt && deferredPrompt) {
    return (
      <div
        className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: 'calc(var(--bottomnav-height, 0px) + 1em)' }}
      >
        <div className="bg-card rounded-lg shadow-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Download className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Install BOSS App
                </h3>
                <p className="text-xs text-muted-foreground">
                  Install untuk akses yang lebih cepat
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismissPwa}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInstallPwa} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={handleDismissPwa} className="px-4">
              Nanti
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isAndroid && !dismissed) {
    return (
      <div
        className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: 'calc(var(--bottomnav-height, 0px) + 1em)' }}
      >
        <div className="bg-card rounded-lg shadow-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {nativeAppFound ? 'Buka Aplikasi BOSS' : 'Download Aplikasi Android'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {nativeAppFound
                    ? 'Dapatkan pengalaman terbaik dengan aplikasi Android BOSS'
                    : 'Install aplikasi Android untuk pengalaman yang lebih optimal'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismissAndroid}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {nativeAppFound ? (
              <Button onClick={handleOpenApp} className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            ) : (
              <Button onClick={handleDownloadApk} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download APK
              </Button>
            )}
            <Button variant="outline" onClick={handleDismissAndroid} className="px-4">
              Nanti
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
