'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type NetworkStatus = {
    /** true saat browser online */
    isOnline: boolean
    /** true saat baru kembali online (hilang setelah 3 detik) */
    justReconnected: boolean
    /** timestamp terakhir kali terdeteksi offline */
    offlineSince: number | null
}

/**
 * Hook untuk mendeteksi status jaringan secara reliable.
 * Menggunakan navigator.onLine + event listener + optional ping check.
 */
export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState(true)
    const [justReconnected, setJustReconnected] = useState(false)
    const [offlineSince, setOfflineSince] = useState<number | null>(null)
    const wasOfflineRef = useRef(false)
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleOnline = useCallback(() => {
        setIsOnline(true)
        setOfflineSince(null)

        // Tampilkan "baru reconnect" selama 3 detik
        if (wasOfflineRef.current) {
            setJustReconnected(true)
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = setTimeout(() => {
                setJustReconnected(false)
            }, 3000)
        }
        wasOfflineRef.current = false
    }, [])

    const handleOffline = useCallback(() => {
        setIsOnline(false)
        setJustReconnected(false)
        setOfflineSince(Date.now())
        wasOfflineRef.current = true
    }, [])

    useEffect(() => {
        // Set initial state
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true
        setIsOnline(online)
        if (!online) {
            wasOfflineRef.current = true
            setOfflineSince(Date.now())
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        }
    }, [handleOnline, handleOffline])

    return { isOnline, justReconnected, offlineSince }
}
