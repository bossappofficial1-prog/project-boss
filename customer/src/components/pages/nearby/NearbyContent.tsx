"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useNearbyOutlets } from '@/hooks/useNearbyOutlets';
import { useUserPosition } from '@/hooks/userUserPosition';
import { OutletCard } from '@/components/pages/home/OutletCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/Base';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useI18n';
import { Search, SearchDropdown, SearchInput } from '@/components/shared/search';
import { DistanceSelector } from '@/components/shared/DistanceSelector';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { OutletDetails } from '@/types';

const LAST_POSITION_KEY = 'lastPosition';
const LAST_POSITION_TTL_MS = 3 * 60 * 1000;

const normalizeOutlet = (outlet: OutletDetails) => ({
    ...outlet,
    createdAt: outlet.createdAt ?? new Date().toISOString(),
    updatedAt: outlet.updatedAt ?? new Date().toISOString(),
    businessId: outlet.businessId ?? outlet.id ?? '',
    operatingHours: outlet.operatingHours ?? [],
});

export function NearbyOutletContent() {
    const t = useTranslations('nearbyPage');
    const { position, loading: positionLoading } = useUserPosition();
    const { setAppBar } = useAppBarV2();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedDistance, setSelectedDistance] = useState(10);
    const [hasLastPosition, setHasLastPosition] = useState<{
        latitude: number;
        longitude: number;
        expireTo: string;
    } | null>(null);

    // Ref untuk Infinite Scroll
    const loadMoreRef = useRef(null);

    // 1. Initial Load & AppBar Setup
    useEffect(() => {
        setAppBar({ title: t('appBarTitle'), showPartnerToggle: false });

        const raw = localStorage.getItem(LAST_POSITION_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (new Date(parsed.expireTo).getTime() > Date.now()) {
                    setHasLastPosition(parsed);
                } else {
                    localStorage.removeItem(LAST_POSITION_KEY);
                }
            } catch (e) {
                localStorage.removeItem(LAST_POSITION_KEY);
            }
        }
    }, [t, setAppBar]);

    // 2. Persist Position to LocalStorage
    useEffect(() => {
        if (position?.[0] && position?.[1]) {
            const data = {
                latitude: position[0],
                longitude: position[1],
                expireTo: new Date(Date.now() + LAST_POSITION_TTL_MS).toISOString(),
            };
            localStorage.setItem(LAST_POSITION_KEY, JSON.stringify(data));
            setHasLastPosition(data);
        }
    }, [position]);

    // 3. Memoized Effective Position
    const effectivePosition = useMemo(() => {
        if (position?.[0] && position?.[1]) return position;
        if (hasLastPosition) return [hasLastPosition.latitude, hasLastPosition.longitude];
        return null;
    }, [position, hasLastPosition]);

    // 4. Optimized Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // 5. Data Fetching
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
        latitude: effectivePosition?.[0],
        longitude: effectivePosition?.[1],
        radius: selectedDistance,
        take: 10,
        search: debouncedSearch || undefined,
        enabled: Boolean(effectivePosition)
    });

    // 6. Memoized Normalized Data
    const allOutlets = useMemo(() => {
        return data?.pages.flatMap(page => page.data.map(normalizeOutlet)) || [];
    }, [data]);

    // 7. Infinite Scroll dengan Intersection Observer
    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Conditional Rendering logic
    if (!effectivePosition) {
        return (
            <div className="max-w-md mx-auto p-4">
                {positionLoading ? (
                    <LoadingState message={t('loadingLocation')} />
                ) : (
                    <EmptyState
                        title={t('locationRequired')}
                        description={t('locationRequiredDesc')}
                        action={{ label: t('retry'), onClick: () => window.location.reload() }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Compact Filter Bar */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-4">
                <div className="flex gap-0 shadow-sm rounded-md border bg-card">
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
                                className="rounded-r-none border-0 focus-visible:ring-0"
                            />
                            <SearchDropdown />
                        </Search>
                    </div>

                    <div className="w-24 sm:w-28 relative flex items-center justify-center">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-border" />
                        <DistanceSelector
                            value={selectedDistance}
                            onChange={setSelectedDistance}
                            className='mb-0 border-0 focus:ring-0'
                        />
                    </div>
                </div>
            </div>

            {/* States handling */}
            {isLoading && <LoadingState message={t('findingOutlets')} />}
            {isError && (
                <ErrorState
                    title={t('failedToLoad')}
                    message={error?.message || t('somethingWrong')}
                    onRetry={refetch}
                />
            )}

            {!isLoading && !isError && (
                <>
                    {allOutlets.length === 0 ? (
                        <EmptyState
                            title={search ? t('noOutletsFound') : t('noNearbyOutlets')}
                            description={search ? `${t('noOutletsForSearch')} "${search}"` : t('noOutletsWithinRange')}
                            action={search ? { label: t('clearSearch'), onClick: () => setSearch('') } : undefined}
                        />
                    ) : (
                        <>
                            <div className="mb-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {data?.pages[0]?.total || allOutlets.length} {t('outletCount')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {allOutlets.map((outlet) => (
                                    <OutletCard
                                        key={outlet.id}
                                        outlet={outlet as any}
                                        alignment="horizontal"
                                        from='nearby'
                                    />
                                ))}
                            </div>

                            {/* Sentinel element for Infinite Scroll */}
                            <div ref={loadMoreRef} className="py-8 flex justify-center">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('loadingMore')}
                                    </div>
                                ) : hasNextPage ? (
                                    <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>
                                        {t('loadMore')}
                                    </Button>
                                ) : (
                                    <p className="text-xs text-muted-foreground">{t('noMoreOutlets')}</p>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}