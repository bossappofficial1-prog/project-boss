"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNearbyOutlets } from '@/hooks/useNearbyOutlets';
import { useUserPosition } from '@/hooks/userUserPosition';
import { OutletCard } from '@/components/home/OutletCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/Base';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useI18n';
import { Search, SearchDropdown, SearchInput } from '@/components/shared/search';
import { DistanceSelector } from '@/components/shared/DistanceSelector';
import { Outlet } from '@/services/outlets';
import { useAppBarV2 } from '@/context/AppBarContextV2';

function NearbyOutletContent() {
    const t = useTranslations('nearbyPage');
    const { position, loading: positionLoading } = useUserPosition();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedDistance, setSelectedDistance] = useState(10);
    const { setAppBar } = useAppBarV2()

    useEffect(() => {
        if (position?.[0] && position?.[1]) {
            const debugNearbyOutlets = async () => {
                try {
                    const res = await Outlet.getNearby({
                        latitude: position[0],
                        longitude: position[1]
                    });
                } catch (error) {
                    console.error('Error fetching nearby outlets:', error);
                }
            };

            debugNearbyOutlets();
        }
    }, [position]);

    useEffect(() => {
        typeof window !== undefined && setAppBar({ title: t('appBarTitle') })
    }, [])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch
    } = useNearbyOutlets({
        latitude: position?.[0],
        longitude: position?.[1],
        radius: selectedDistance,
        take: 10,
        search: debouncedSearch || undefined,
        enabled: !positionLoading && !!(position?.[0] && position?.[1])
    });

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop
            !== document.documentElement.offsetHeight ||
            isFetchingNextPage ||
            !hasNextPage
        ) {
            return;
        }
        fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Get all outlets from all pages
    const allOutlets = data?.pages.flatMap(page => page.data) || [];

    if (positionLoading) {
        return (
            <div className="max-w-md mx-auto p-4">
                <LoadingState message={t('loadingLocation')} />
            </div>
        );
    }

    if (!position) {
        return (
            <div className="max-w-md mx-auto p-4">
                <EmptyState
                    title={t('locationRequired')}
                    description={t('locationRequiredDesc')}
                    action={{
                        label: t('retry'),
                        onClick: () => window.location.reload()
                    }}
                />
            </div>
        );
    }

    return (
        <>
            {/* Compact Filter Bar */}
            <div className="relative mb-4">
                <div className="flex gap-0 shadow-sm rounded-md">
                    {/* Search Container */}
                    <div className="flex-1 relative">
                        <Search
                            value={search}
                            onChange={setSearch}
                            namespace='nearby'
                            size='sm'
                            onSearch={setSearch}
                            className='mb-0'
                        >
                            <SearchInput
                                placeholder={t('searchPlaceholder')}
                                className="rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0 focus:border-primary/50"
                            />
                            <SearchDropdown />
                        </Search>
                    </div>

                    {/* Distance Selector - Compact */}
                    <div className="w-24 sm:w-28 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-border z-10"></div>
                        <DistanceSelector
                            value={selectedDistance}
                            onChange={setSelectedDistance}
                            className='mb-0'
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading && (
                <LoadingState message={t('findingOutlets')} />
            )}

            {isError && (
                <ErrorState
                    title={t('failedToLoad')}
                    message={error?.message || t('somethingWrong')}
                    onRetry={() => refetch()}
                />
            )}

            {!isLoading && !isError && allOutlets.length === 0 && (
                <EmptyState
                    title={search ? t('noOutletsFound') : t('noNearbyOutlets')}
                    description={search
                        ? `${t('noOutletsForSearch')} "${search}". ${t('tryDifferentTerm')}`
                        : t('noOutletsWithinRange')
                    }
                    action={search ? {
                        label: t('clearSearch'),
                        onClick: () => setSearch('')
                    } : undefined}
                />
            )}

            {!isLoading && !isError && allOutlets.length > 0 && (
                <>
                    {/* Results count */}
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            {data?.pages[0]?.total || allOutlets.length} {t('outletCount')}
                            {search && ` ${t('outletsFoundFor')} "${search}"`}
                        </p>
                    </div>

                    {/* Outlets List */}
                    <div className="space-y-2">
                        {allOutlets.map((outlet, index) => {
                            const normalizedOutlet = {
                                ...outlet,
                                createdAt: (outlet as any).createdAt ?? new Date().toISOString(),
                                updatedAt: (outlet as any).updatedAt ?? new Date().toISOString(),
                                businessId: (outlet as any).businessId ?? (outlet as any).id ?? '',
                                operatingHours: (outlet as any).operatingHours ?? [],
                            } as unknown as any;

                            return (
                                <OutletCard
                                    key={`${outlet.id}-${index}`}
                                    outlet={normalizedOutlet}
                                    alignment="horizontal"
                                />
                            );
                        })}
                    </div>

                    {/* Load More / Loading */}
                    <div className="mt-6 flex justify-center">
                        {isFetchingNextPage ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('loadingMore')}
                            </div>
                        ) : hasNextPage ? (
                            <Button
                                variant="outline"
                                onClick={() => fetchNextPage()}
                                className="w-full"
                            >
                                {t('loadMore')}
                            </Button>
                        ) : allOutlets.length > 0 && (
                            <p className="text-sm text-muted-foreground text-center">
                                {t('noMoreOutlets')}
                            </p>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

export default function NearbyOutletPage() {
    const t = useTranslations('nearbyPage');

    return (
        <Suspense fallback={<LoadingState message={t('loadingNearby')} />}>
            <NearbyOutletContent />
        </Suspense>
    );
}