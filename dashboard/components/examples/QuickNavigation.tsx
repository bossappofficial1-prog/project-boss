'use client'

import { InstantLink } from '@/components/ui/instant-link'
import { Button } from '@/components/ui/button'
import { useInstantNavigation } from '@/hooks/useInstantNavigation'

/**
 * Contoh penggunaan instant navigation
 * Perpindahan halaman akan instant tanpa bergantung kecepatan internet
 */
export function QuickNavigation() {
    const { push } = useInstantNavigation()

    const handleNavigate = (href: string) => {
        // Ini akan trigger loading bar instantly
        // Tidak perlu tunggu data fetch sebelum berpindah halaman
        push(href)
    }

    return (
        <div className="space-y-4">
            {/* Method 1: Menggunakan InstantLink component */}
            <div>
                <h3 className="text-sm font-medium mb-2">Menggunakan InstantLink:</h3>
                <InstantLink href="/admin/dashboard" className="text-blue-500 hover:underline">
                    Go to Admin Dashboard
                </InstantLink>
            </div>

            {/* Method 2: Menggunakan useInstantNavigation hook */}
            <div>
                <h3 className="text-sm font-medium mb-2">Menggunakan useInstantNavigation:</h3>
                <Button onClick={() => handleNavigate('/owner/dashboard')} size="sm">
                    Go to Owner Dashboard
                </Button>
            </div>

            {/* Method 3: Combine dengan form action */}
            <div>
                <h3 className="text-sm font-medium mb-2">Navigasi setelah action:</h3>
                <Button
                    onClick={async () => {
                        // Trigger loading instantly
                        handleNavigate('/owner/orders')
                    }}
                    size="sm"
                    variant="outline"
                >
                    View Orders
                </Button>
            </div>
        </div>
    )
}
