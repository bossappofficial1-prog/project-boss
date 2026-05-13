'use client'

import { Suspense, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/Base'

const OrdersPage = dynamic(() => import('@/components/orders/OrdersPage'), {
    loading: () => <LoadingState message="Loading orders..." />
})

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
