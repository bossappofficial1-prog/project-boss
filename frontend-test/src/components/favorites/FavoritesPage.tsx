'use client'

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslations } from '@/hooks/useI18n';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState } from '@/components/Base';
import FavoriteOutletCard from './FavoriteOutletCard';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
    const { favorites, clearFavorites } = useFavorites();
    const { setAppBar } = useAppBarV2();
    const t = useTranslations('favorites');
    const router = useRouter();
    const hasUpdatedRef = useRef(false);

    const rightContent = useMemo(() => {
        if (favorites.length > 0) {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFavorites}
                    className="text-destructive hover:text-destructive"
                >
                    Clear All
                </Button>
            );
        }
        return null;
    }, [favorites.length, clearFavorites]);

    const appBarConfig = useMemo(() => ({
        title: t('title'),
        subtitle: t('subtitle'),
        showSearch: false,
        centerTitle: true,
        rightContent
    }), [t, rightContent]);

    useLayoutEffect(() => {
        if (!hasUpdatedRef.current) {
            setAppBar(appBarConfig);
            hasUpdatedRef.current = true;
        }
    }, [setAppBar, appBarConfig]);

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
