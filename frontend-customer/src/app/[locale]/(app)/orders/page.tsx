'use client'

import { Suspense, useEffect } from 'react'
import OrdersPage from '@/components/orders/OrdersPage'
import { LoadingState } from '@/components/Base'

export default function Orders() {
    useEffect(() => {
        document.title = 'Riwayat Order'
    }, [])
    return (
        <Suspense fallback={<LoadingState message="Loading orders..." />}>
            <OrdersPage />
        </Suspense>
    )
}
