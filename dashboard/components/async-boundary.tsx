'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useLoadingStore } from '@/stores/loading.store'

interface AsyncBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    onLoadingChange?: (isLoading: boolean) => void
}

/**
 * Wrap async content with this to show skeleton/loading state
 * This works in conjunction with instant navigation
 * The global loading bar shows immediately, this shows content skeleton
 */
export function AsyncBoundary({
    children,
    fallback,
    onLoadingChange,
}: AsyncBoundaryProps) {
    const { isLoading } = useLoadingStore()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        onLoadingChange?.(isLoading)
    }, [isLoading, onLoadingChange])

    if (!isMounted) return fallback

    return (
        <Suspense fallback={fallback || <div className="p-4 text-muted-foreground">Loading...</div>}>
            {children}
        </Suspense>
    )
}
