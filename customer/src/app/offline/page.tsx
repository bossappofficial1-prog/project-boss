'use client'

export const dynamic = 'force-static';

import { WifiOff, RefreshCw, CloudOff, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false)

  // Jika user mengakses /offline tapi sudah online, redirect ke home
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      window.location.replace('/')
    }

    const handleOnline = () => {
      window.location.replace('/')
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const handleRetry = () => {
    setIsChecking(true)
    // Cek koneksi dulu sebelum reload
    if (navigator.onLine) {
      window.location.replace('/')
    } else {
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fake AppBar - supaya terasa seperti di dalam app */}
      <header className="flex items-center px-4 py-3 min-h-[54px] bg-background/95 backdrop-blur-lg border-b border-border/40 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-3xl mx-auto w-full">
          <div className="w-8 h-8 relative flex-shrink-0">
            <Image
              src="/assets/logo/logo-bossapp.svg"
              alt="BOSS"
              width={32}
              height={32}
              className="rounded-md"
            />
          </div>
          <span className="font-semibold text-foreground text-base">BOSS Customer</span>
          <div className="ml-auto flex items-center gap-1 text-destructive">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium">Offline</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-muted/60 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <CloudOff className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/30 border-[3px] border-background">
            <WifiOff className="w-4 h-4 text-destructive-foreground" />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-xl font-bold text-foreground mb-2">
          Anda Sedang Offline
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-[280px] mb-6 leading-relaxed">
          Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Memeriksa...' : 'Coba Lagi'}
          </button>

          <button
            onClick={() => window.location.replace('/')}
            className="flex items-center justify-center gap-2 bg-muted text-foreground px-6 py-3 rounded-xl font-medium text-sm hover:bg-muted/80 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            Ke Beranda
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 w-full max-w-sm">
          <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-base">💡</span>
              Tips
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-0.5">•</span>
                <span>Periksa koneksi WiFi atau data seluler Anda</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-0.5">•</span>
                <span>Pastikan mode pesawat tidak aktif</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-0.5">•</span>
                <span>Coba pindah ke lokasi dengan sinyal lebih baik</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-muted-foreground/50">
          BOSS Customer App
        </p>
      </main>

      {/* Fake BottomNav - supaya terasa seperti di dalam app */}
      <div className="fixed bottom-0 left-0 right-0 z-[99] px-4 py-2 bg-background/80 backdrop-blur-lg border-t">
        <nav className="mx-auto flex max-w-lg items-center justify-between">
          {[
            { label: 'Home', icon: '🏠' },
            { label: 'Nearby', icon: '📍' },
            { label: 'Cart', icon: '🛒' },
            { label: 'Orders', icon: '🧾' },
            { label: 'Profile', icon: '👤' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-0.5 px-3 py-1 opacity-40 cursor-not-allowed">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}