'use client'

import React from 'react'
import { WifiOff, RefreshCw, CloudOff, Wifi } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

/**
 * Overlay yang tampil di atas konten (tapi tetap di dalam app shell / layout)
 * saat user offline. Mirip YouTube: AppBar + BottomNav tetap terlihat,
 * tapi area konten diganti info offline.
 */
export function OfflineOverlay({ children }: { children: React.ReactNode }) {
    const { isOnline, justReconnected } = useNetworkStatus()

    // Saat online, tampilkan children seperti biasa
    if (isOnline && !justReconnected) {
        return <>{children}</>
    }

    // Saat baru reconnect, tampilkan children + toast reconnect
    if (isOnline && justReconnected) {
        return (
            <>
                {children}
                <ReconnectedBanner />
            </>
        )
    }

    // Saat offline, tampilkan offline content menggantikan children
    return <OfflineContent />
}

function ReconnectedBanner() {
    return (
        <div className="fixed top-[calc(var(--appbar-height,54px)+8px)] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-green-500/25">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Koneksi kembali normal</span>
            </div>
        </div>
    )
}

function OfflineContent() {
    const handleRetry = () => {
        window.location.reload()
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-500">
            {/* Icon */}
            <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full bg-muted/60 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <CloudOff className="w-10 h-10 text-muted-foreground" />
                    </div>
                </div>
                {/* Status badge */}
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/30 border-[3px] border-background">
                    <WifiOff className="w-4 h-4 text-destructive-foreground" />
                </div>
            </div>

            {/* Text */}
            <h2 className="text-xl font-bold text-foreground mb-2">
                Anda Sedang Offline
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-[280px] mb-6 leading-relaxed">
                Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.
            </p>

            {/* Retry button */}
            <button
                onClick={handleRetry}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
            </button>

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
        </div>
    )
}

/**
 * Banner kecil yang muncul di atas konten saat offline (tanpa menggantikan konten).
 * Cocok untuk halaman yang sudah ter-cache dan masih bisa ditampilkan.
 */
export function OfflineBanner() {
    const { isOnline } = useNetworkStatus()

    if (isOnline) return null

    return (
        <div className="sticky top-0 z-40 bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-medium">Anda sedang offline</span>
                <span className="text-destructive-foreground/70">— beberapa fitur mungkin tidak tersedia</span>
            </div>
        </div>
    )
}
