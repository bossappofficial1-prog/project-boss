'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslations } from '@/hooks/useI18n';
import { useAppBar } from '@/context/AppBarContext';
import { EmptyState } from '@/components/Base';
import FavoriteOutletCard from './FavoriteOutletCard';
import { Heart, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
    const { favorites, clearFavorites } = useFavorites();
    const { updateAppbar } = useAppBar();
    const t = useTranslations('favorites');
    const router = useRouter();

    useEffect(() => {
        updateAppbar({
            title: t('title'),
            subtitle: t('subtitle'),
            showSearch: false,
            centerTitle: true,
            rightContent: favorites.length > 0 ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFavorites}
                    className="text-destructive hover:text-destructive"
                >
                    Clear All
                </Button>
            ) : null
        });
    }, [updateAppbar, t, favorites.length, clearFavorites]);

    const handleBrowseOutlets = () => {
        router.push('/nearby');
    };

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <EmptyState
                    title={t('empty.title')}
                    description={t('empty.description')}
                    icon={<Heart className="w-6 h-6 text-muted-foreground" />}
                    action={{
                        label: t('empty.browse'),
                        onClick: handleBrowseOutlets
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {favorites.length} {favorites.length === 1 ? 'outlet' : 'outlets'} saved
                </p>
            </div>

            <div className="grid gap-3">
                {favorites.map((outlet) => (
                    <FavoriteOutletCard
                        key={outlet.id}
                        outlet={outlet}
                    />
                ))}
            </div>
        </div>
    );
}
