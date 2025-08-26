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
import { Outlet } from '@/services/outlets';

function NearbyOutletContent() {
    const t = useTranslations('nearbyPage');
    const { position, loading: positionLoading } = useUserPosition();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        if (position?.[0] && position?.[1]) {
            const debugNearbyOutlets = async () => {
                try {
                    const res = await Outlet.getNearby({
                        latitude: position[0],
                        longitude: position[1]
                    });
                    console.log('Distance data:', res.map(m => m.distance));
                } catch (error) {
                    console.error('Error fetching nearby outlets:', error);
                }
            };

            debugNearbyOutlets();
        }
    }, [position]);

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
        radius: 10,
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
                <LoadingState message="Getting your location..." />
            </div>
        );
    }

    if (!position) {
        return (
            <div className="max-w-md mx-auto p-4">
                <EmptyState
                    title="Location Required"
                    description="Please enable location access to find nearby outlets"
                    action={{
                        label: "Retry",
                        onClick: () => window.location.reload()
                    }}
                />
            </div>
        );
    }

    return (
        <>
            <Search
                value={search}
                onChange={setSearch}
                namespace='nearby'
                size='md'
                onSearch={setSearch}
                className='mb-4'
            >
                <SearchInput
                    placeholder={t('searchPlaceholder')}
                />
                <SearchDropdown />
            </Search>

            {/* Content */}
            {isLoading && (
                <LoadingState message="Finding nearby outlets..." />
            )}

            {isError && (
                <ErrorState
                    title="Failed to load outlets"
                    message={error?.message || "Something went wrong"}
                    onRetry={() => refetch()}
                />
            )}

            {!isLoading && !isError && allOutlets.length === 0 && (
                <EmptyState
                    title={search ? "No outlets found" : "No nearby outlets"}
                    description={search
                        ? `No outlets found for "${search}". Try a different search term.`
                        : "There are no outlets within 10km of your location."
                    }
                    action={search ? {
                        label: "Clear search",
                        onClick: () => setSearch('')
                    } : undefined}
                />
            )}

            {!isLoading && !isError && allOutlets.length > 0 && (
                <>
                    {/* Results count */}
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            {data?.pages[0]?.total || allOutlets.length} outlets found
                            {search && ` for "${search}"`}
                        </p>
                    </div>

                    {/* Outlets List */}
                    <div className="space-y-3">
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
                                Loading more outlets...
                            </div>
                        ) : hasNextPage ? (
                            <Button
                                variant="outline"
                                onClick={() => fetchNextPage()}
                                className="w-full"
                            >
                                Load More
                            </Button>
                        ) : allOutlets.length > 0 && (
                            <p className="text-sm text-muted-foreground text-center">
                                No more outlets to load
                            </p>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

export default function NearbyOutletPage() {
    return (
        <Suspense fallback={<LoadingState message="Loading nearby outlets..." />}>
            <NearbyOutletContent />
        </Suspense>
    );
}