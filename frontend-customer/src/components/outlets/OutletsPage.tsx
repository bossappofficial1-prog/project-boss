"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { OutletCard } from "@/components/pages/home/OutletCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchOutlets } from "@/hooks/useSearchOutlets";
import { Loader2, Store, ChevronDown } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Base";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useTranslations } from "@/hooks/useI18n";
import { useRouter, useSearchParams } from "next/navigation";

const RESULTS_PER_PAGE = 12;

export default function OutletsPage() {
    const t = useTranslations("outletsPage");
    const { setAppBar, resetAppBar } = useAppBarV2();
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryParam = searchParams.get("q") ?? "";
    const [search, setSearch] = useState(queryParam);
    const debouncedSearch = useDebounce(search, 400);

    const handleAppBarSearch = useCallback(
        (value: string) => {
            setSearch(value);
            const trimmed = value.trim();
            const query = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
            router.replace(`/outlets${query}`);
        },
        [router]
    );

    useEffect(() => {
        setAppBar({
            title: t("title"),
            showBackButton: true,
            showSearch: true,
            onSearch: handleAppBarSearch,
        });

        return () => resetAppBar();
    }, [resetAppBar, setAppBar, t, handleAppBarSearch]);

    useEffect(() => {
        setSearch(queryParam);
    }, [queryParam]);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useSearchOutlets({
        take: RESULTS_PER_PAGE,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
        enabled: true,
    });

    const outlets = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
    const total = data?.pages?.[0]?.total ?? 0;
    const shownCount = total > 0 ? Math.min(outlets.length, total) : outlets.length;
    const hasResults = outlets.length > 0;

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const renderEmptyOrPrompt = () => {
        if (!search.trim()) {
            return (
                <EmptyState
                    icon={<Store className="w-8 h-8 text-muted-foreground" />}
                    title={t("empty.title")}
                    description={t("empty.emptySearch")}
                />
            );
        }

        return (
            <EmptyState
                icon={<Store className="w-8 h-8 text-muted-foreground" />}
                title={t("empty.title")}
                description={t("empty.description")}
            />
        );
    };

    return (
        <div className="space-y-4 pb-8">
            {isLoading && !hasResults ? (
                <LoadingState message={t("loading")} />
            ) : isError ? (
                <ErrorState
                    title={t("error.title")}
                    message={(error as any)?.message ?? t("error.generic")}
                    onRetry={() => refetch()}
                />
            ) : !hasResults ? (
                renderEmptyOrPrompt()
            ) : (
                <>
                    {/* Results header */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                            {t("results", { count: shownCount, total: total || shownCount })}
                        </p>
                    </div>

                    {/* Outlet grid */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {outlets.map((outlet) => (
                            <OutletCard key={outlet.id} outlet={outlet as any} alignment="horizontal" />
                        ))}
                    </div>

                    {/* Load more */}
                    <div className="flex justify-center pt-2">
                        {hasNextPage ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLoadMore}
                                disabled={isFetchingNextPage}
                                className="w-full max-w-xs h-9 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {t("loadingMore")}
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-3.5 w-3.5" />
                                        {t("loadMore")}
                                    </>
                                )}
                            </Button>
                        ) : (
                            <p className="text-[11px] text-muted-foreground/60">{t("noMore")}</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
