'use client'

import React, { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useGlobalLoading } from '@/contexts/LoadingContext'

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { isLoading, stopLoading } = useGlobalLoading()

    // Stop loading when route changes (pathname updated)
    useEffect(() => {
        if (isLoading) {
            // Delay for smooth transition
            const timeout = setTimeout(() => stopLoading(), 600)
            return () => clearTimeout(timeout)
        }
    }, [pathname, searchParams, isLoading, stopLoading])

    return (
        <>
            <ProgressBar isVisible={isLoading} />
            {children}
        </>
    )
}
