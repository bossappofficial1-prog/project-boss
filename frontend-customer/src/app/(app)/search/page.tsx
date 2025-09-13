"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchOutlets } from '@/hooks/useSearchOutlets';
import { OutletCard } from '@/components/home/OutletCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/Base';
import { Button } from '@/components/ui/button';
import { Loader2, Store, Search as SearchIcon } from 'lucide-react';
import { useTranslations } from '@/hooks/useI18n';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchOutletContent() {
    const t = useTranslations('searchPage');
    const query = useSearchParams().get("q")
    const { setAppBar, resetAppBar } = useAppBarV2();
    const [search, setSearch] = useState(query || '');

    useEffect(() => {
        setAppBar({
            title: t('title'),
            sticky: true,
            subtitle: t('subtitle'),
            showSearch: true,
            showBackButton: true,
            onSearch(query) {
                setSearch(query)
            },
        });

        return () => resetAppBar()
    }, [setAppBar, t]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch
    } = useSearchOutlets({
        take: 10,
        search: search || undefined,
        enabled: !!search.trim(),
    });

    const allOutlets = data?.pages.flatMap(page => page.data) || [];

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }

        if (isError) {
            return <ErrorState message={error?.message || t('searchError')} onRetry={refetch} />;
        }

        if (allOutlets.length > 0) {
            return (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <Store className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {allOutlets.length} {t('outletCount')} {t('for')} "<span className="font-medium">{search}</span>"
                        </span>
                    </div>
                    <div className="grid gap-2 mb-6">
                        {allOutlets.map((outlet) => (
                            <OutletCard key={outlet.id} outlet={outlet as any} from='search' alignment="horizontal" />
                        ))}
                    </div>
                    {hasNextPage && (
                        <div className="flex justify-center">
                            <Button onClick={handleLoadMore} disabled={isFetchingNextPage} variant="outline" className="px-8">
                                {isFetchingNextPage ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('loading')}</>
                                ) : (
                                    t('loadMore')
                                )}
                            </Button>
                        </div>
                    )}
                    {!hasNextPage && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noMoreOutlets')}</p>
                        </div>
                    )}
                </>
            );
        }

        return (
            <EmptyState
                icon={<Store className="w-6 h-6 text-muted-foreground" />}
                title={t('noOutletsFound')}
                description={t('noResultsFor').replace('{query}', search)}
            />
        );
    };

    return (
        <>
            {search.trim() ? (
                renderContent()
            ) : (
                <EmptyState
                    icon={<SearchIcon className="w-6 h-6 text-muted-foreground" />}
                    title={t('startSearching')}
                    description={t('searchDescription')}
                />
            )}
        </>
    );
}

export default function SearchOutletPage() {
    return (
        <Suspense fallback={<LoadingState message="Loading search..." />}>
            <SearchOutletContent />
        </Suspense>
    );
}