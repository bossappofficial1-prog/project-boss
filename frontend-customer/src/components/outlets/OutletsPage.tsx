"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { OutletCard } from "@/components/home/OutletCard";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchOutlets } from "@/hooks/useSearchOutlets";
import { Loader2, Store } from "lucide-react";
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
            subtitle: t("subtitle"),
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
        <>
            {/* <section className="space-y-2">
                <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground md:text-2xl">{t("title")}</p>
                    <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("searchDescription")}</p>
                </div>
            </section> */}

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
                <section className="space-y-4 pt-5">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {t("results", { count: shownCount, total: total || shownCount })}
                        </span>
                        <span className="text-xs text-muted-foreground">{t("resultsHint")}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {outlets.map((outlet) => (
                            <OutletCard key={outlet.id} outlet={outlet as any} alignment="vertical" />
                        ))}
                    </div>
                    <div className="flex justify-center pt-1">
                        {hasNextPage ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLoadMore}
                                disabled={isFetchingNextPage}
                                className="w-full max-w-xs px-6"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("loadingMore")}
                                    </>
                                ) : (
                                    t("loadMore")
                                )}
                            </Button>
                        ) : (
                            <p className="text-xs text-muted-foreground">{t("noMore")}</p>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}
