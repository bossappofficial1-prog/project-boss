'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useLoadingStore } from '@/stores/loading.store'

export function useInstantNavigation() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const { setIsLoading } = useLoadingStore()

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
