import { Suspense } from 'react'
import FavoritesPage from '@/components/favorites/FavoritesPage'
import { LoadingState } from '@/components/Base'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Favorite'
}

export default function Favorites() {
    return (
        <Suspense fallback={<LoadingState message="Loading favorites..." />}>
            <FavoritesPage />
        </Suspense>
    )
}
