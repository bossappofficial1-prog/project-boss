"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchOutlets } from '@/hooks/useSearchOutlets';
import { OutletCard } from '@/components/home/OutletCard';
import { LoadingState, EmptyState, ErrorState } from '@/components/Base';
import { SearchComponent } from '@/components/shared/SearchComponent';
import { Button } from '@/components/ui/button';
import { Loader2, Store, Search as SearchIcon } from 'lucide-react';
import { useTranslations } from '@/hooks/useI18n';
import { useAppBar } from '@/context/AppBarContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, SearchDropdown, SearchInput } from '@/components/shared/search';

function SearchOutletContent() {
    const t = useTranslations('searchPage');
    const { updateAppbar } = useAppBar();

    const [search, setSearch] = useState('');

    // REFACTOR: Menggunakan custom hook untuk kebersihan kode
    const debouncedSearch = useDebounce(search, 500);

    // REFACTOR: Efek ini hanya untuk memuat state dari sessionStorage saat pertama kali render
    useEffect(() => {
        const savedSearch = sessionStorage.getItem('currentSearch');
        if (savedSearch) {
            setSearch(savedSearch);
        }
    }, []);

    // REFACTOR: Efek ini hanya untuk menyimpan state ke sessionStorage saat pencarian benar-benar dilakukan
    useEffect(() => {
        if (debouncedSearch) {
            sessionStorage.setItem('currentSearch', debouncedSearch);
        } else {
            sessionStorage.removeItem('currentSearch');
        }
    }, [debouncedSearch]);

    useEffect(() => {
        updateAppbar({
            title: t('searchPage.title'),
            sticky: true,
            subtitle: t('searchPage.subtitle'),
            showSearch: false,
        });
    }, [updateAppbar, t]);

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
        search: debouncedSearch || undefined,
        enabled: !!debouncedSearch.trim(),
    });

    const allOutlets = data?.pages.flatMap(page => page.data) || [];

    // REFACTOR: Menggunakan useCallback untuk memoization
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Fungsi untuk merender konten hasil pencarian
    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }

        if (isError) {
            return <ErrorState message={error?.message || t('searchPage.searchError')} onRetry={refetch} />;
        }

        if (allOutlets.length > 0) {
            return (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <Store className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {allOutlets.length} {t('searchPage.outletCount')} {t('searchPage.for')} "<span className="font-medium">{debouncedSearch}</span>"
                        </span>
                    </div>
                    <div className="grid gap-4 mb-6">
                        {allOutlets.map((outlet) => (
                            <OutletCard key={outlet.id} outlet={outlet as any} alignment="horizontal" />
                        ))}
                    </div>
                    {hasNextPage && (
                        <div className="flex justify-center">
                            <Button onClick={handleLoadMore} disabled={isFetchingNextPage} variant="outline" className="px-8">
                                {isFetchingNextPage ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('searchPage.loading')}</>
                                ) : (
                                    t('searchPage.loadMore')
                                )}
                            </Button>
                        </div>
                    )}
                    {!hasNextPage && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('searchPage.noMoreOutlets')}</p>
                        </div>
                    )}
                </>
            );
        }

        return (
            <EmptyState
                icon={<Store className="w-6 h-6 text-muted-foreground" />}
                title={t('searchPage.noOutletsFound')}
                description={t('searchPage.noResultsFor').replace('{query}', debouncedSearch)}
            />
        );
    };

    return (
        <>
            <Search
                onChange={handleSearchChange}
                value={search}
                onSearch={handleSearchChange}
                size='md'
                className='mb-2'
            >
                <SearchInput
                    placeholder={t('searchPage.searchPlaceholder')}
                />
                <SearchDropdown />
            </Search>

            {debouncedSearch.trim() ? (
                renderContent()
            ) : (
                <EmptyState
                    icon={<SearchIcon className="w-6 h-6 text-muted-foreground" />}
                    title={t('searchPage.startSearching')}
                    description={t('searchPage.searchDescription')}
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