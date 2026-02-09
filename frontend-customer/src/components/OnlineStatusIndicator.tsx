'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff, Wifi } from 'lucide-react'

/**
 * Indikator status koneksi di Root Layout (luar app shell).
 * Hanya menampilkan toast notification saat transisi online <-> offline.
 * Offline overlay utama ditangani oleh OfflineOverlay di dalam AppLayout.
 */
export default function OnlineStatusIndicator() {
  const { isOnline, justReconnected } = useNetworkStatus()

  // Hanya tampil saat transisi: baru offline atau baru reconnect
  // Untuk halaman di luar (app) layout (misal /offline route langsung)
  if (isOnline && !justReconnected) return null
  if (!isOnline) return null // Sudah ditangani OfflineOverlay di AppLayout

  // Tampilkan banner reconnected singkat
  if (justReconnected) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-in slide-in-from-top-2 fade-in duration-300">
        <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-green-500/25">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Koneksi kembali normal</span>
        </div>
      </div>
    )
  }

  return null
}