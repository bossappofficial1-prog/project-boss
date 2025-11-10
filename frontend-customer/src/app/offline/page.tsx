'use client'

export const dynamic = 'force-static';

import { Wifi, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="relative mb-8">
          <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Wifi className="w-12 h-12 text-gray-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white rounded-full transform rotate-45"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tidak Ada Koneksi Internet
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sepertinya Anda sedang offline. Periksa koneksi internet Anda dan coba lagi.
        </p>

        {/* Retry Button */}
        <Button
          onClick={handleRetry}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </Button>

        {/* Tips */}
        <div className="mt-8 text-left bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tips:</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li>• Periksa koneksi WiFi atau data seluler Anda</li>
            <li>• Pastikan mode pesawat tidak aktif</li>
            <li>• Coba pindah ke lokasi dengan sinyal yang lebih baik</li>
            <li>• Restart router WiFi jika menggunakan WiFi</li>
          </ul>
        </div>

        {/* App Info */}
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          BOSS Customer App v1.0
        </div>
      </div>
    </div>
  )
}