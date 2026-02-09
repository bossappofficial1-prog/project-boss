import { Suspense } from 'react'
import OrdersPage from '@/components/orders/OrdersPage'
import { LoadingState } from '@/components/Base'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Riwayat Order'
}

export default function Orders() {
    return (
        <Suspense fallback={<LoadingState message="Loading orders..." />}>
            <OrdersPage />
        </Suspense>
    )
}
