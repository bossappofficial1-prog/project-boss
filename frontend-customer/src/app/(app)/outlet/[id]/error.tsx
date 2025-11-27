'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/Base'
import { Button } from '@/components/ui/button'

type ErrorProps = {
    error: Error & { digest?: string }
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
    const router = useRouter()

    useEffect(() => {
        console.error('Outlet detail page error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center gap-3 px-4 py-12">
            <ErrorState
                title="Tidak dapat memuat outlet"
                message="Terjadi kesalahan saat memuat data outlet. Coba lagi atau kembali ke beranda."
                onRetry={reset}
            />
            <Button variant="ghost" onClick={() => router.push('/')}>Kembali ke Beranda</Button>
        </div>
    )
}
