import { Suspense } from 'react'
import FavoritesPage from '@/components/favorites/FavoritesPage'
import { LoadingState } from '@/components/Base'

export default function Favorites() {
    return (
        <Suspense fallback={<LoadingState message="Loading favorites..." />}>
            <FavoritesPage />
        </Suspense>
    )
}
