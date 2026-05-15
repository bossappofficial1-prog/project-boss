'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useGlobalLoading } from '@/contexts/LoadingContext'

export function useInstantNavigation() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const { setIsLoading } = useGlobalLoading()

    const push = (href: string) => {
        // Set loading INSTANTLY (before transition starts)
        setIsLoading(true)

        // Start the transition for non-blocking navigation
        startTransition(() => {
            router.push(href)
        })
    }

    const replace = (href: string) => {
        setIsLoading(true)
        startTransition(() => {
            router.replace(href)
        })
    }

    const back = () => {
        setIsLoading(true)
        router.back()
    }

    const prefetch = (href: string) => {
        try {
            router.prefetch(href)
        } catch { }
    }

    return { push, replace, back, prefetch, isPending }
}
