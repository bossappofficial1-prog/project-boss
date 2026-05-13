'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/Base'
import { Button } from '@/components/ui/button'

type ErrorProps = {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ProductError({ error, reset }: ErrorProps) {
    const router = useRouter()

    useEffect(() => {
        console.error('Product detail page error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center gap-3 px-4 py-12">
            <ErrorState
                title="Tidak dapat memuat produk"
                message="Terjadi kesalahan saat memuat detail produk. Coba lagi atau kembali ke halaman outlet."
                onRetry={reset}
            />
            <Button variant="ghost" onClick={() => router.back()}>Kembali</Button>
            <Button onClick={() => router.push('/')}>Kembali ke Beranda</Button>
        </div>
    )
}
