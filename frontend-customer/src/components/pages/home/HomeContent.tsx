"use client"

import React, { useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Heart,
    History,
    MapPin,
} from "lucide-react"

import { HeroCarousel } from "@/components/pages/home/HeroCarousel"
import { DivXScroll } from "@/components/shared/DivXScroll"
import { LoadingState, ErrorState } from "@/components/Base"
import { useHomeSummary } from "@/hooks/useHomeSummary"
import { useTranslations, useLocale, useLocalizedPath } from "@/hooks/useI18n"
import { useAppBarV2 } from "@/context/AppBarContextV2"
import type { HomeSummaryResponse } from "@/types/home"
import HomeSectionHeader from "@/components/pages/home/HomeSectionHeader"
import CategoryCard from "@/components/pages/home/cards/CategoryCard"
import OutletCard from "@/components/pages/home/cards/OutletCard"
import PopularItemCard from "@/components/pages/home/cards/PopularItemCard"
import PromoCard from "@/components/pages/home/cards/PromoCard"
import QuickActionCard from "@/components/pages/home/cards/QuickActionCard"

const QUICK_ACTIONS = [
    { key: "orders", href: "/orders", icon: History },
    { key: "favorites", href: "/favorites", icon: Heart },
    { key: "nearby", href: "/nearby", icon: MapPin },
] as const

function EmptyPlaceholder({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            {message}
        </div>
    )
}

function HomeSections() {
    const { data, isLoading, error, refetch } = useHomeSummary()
    const locale = useLocale()
    const t = useTranslations("homePage")
    const tCommon = useTranslations("common")
    const languageRegion = locale === "en" ? "en-US" : "id-ID"

    const numberFormatter = useMemo(() => new Intl.NumberFormat(languageRegion), [languageRegion])
    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(languageRegion, {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }),
        [languageRegion]
    )
    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(languageRegion, {
                day: "numeric",
                month: "short",
            }),
        [languageRegion]
    )

    const summary = data ?? ({} as Partial<HomeSummaryResponse>)

    const quickActionLabels = useMemo(() => ({
        orders: {
            title: t("quickActions.orders.title"),
            description: t("quickActions.orders.description"),
        },
        favorites: {
            title: t("quickActions.favorites.title"),
            description: t("quickActions.favorites.description"),
        },
        nearby: {
            title: t("quickActions.nearby.title"),
            description: t("quickActions.nearby.description"),
        },
    }), [t])

    if (isLoading) return <LoadingState message={t("loading")} />
    if (error)
        return (
            <ErrorState
                onRetry={() => refetch()}
                message={error.message === "Network Error" ? t("error.network") : t("error.generic")}
            />
        )

    const {
        banners = [], categories = [], outlets = [], popularItems = [], promos = []
    } = summary

    return (
        <div className="space-y-6 pb-20">
            {/* Hero */}
            <HeroCarousel banners={banners} />

            {/* Quick Actions — compact row */}
            <section className="px-1">
                <div className="grid grid-cols-3 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                        <QuickActionCard
                            key={action.key}
                            action={action}
                            labels={quickActionLabels[action.key]}
                        />
                    ))}
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="space-y-3">
                    <HomeSectionHeader
                        title={t("sections.categories.title")}
                        actionLabel={t("sections.categories.action")}
                        href="/search"
                    />
                    <DivXScroll className="gap-3">
                        {categories.map((category) => (
                            <CategoryCard key={category.id} category={category} />
                        ))}
                    </DivXScroll>
                </section>
            )}

            {/* Featured Outlets */}
            <section className="space-y-3">
                <HomeSectionHeader
                    title={t("sections.featured.title")}
                    actionLabel={t("sections.featured.action")}
                    href="/outlets"
                />
                {outlets.length === 0 ? (
                    <EmptyPlaceholder message={t("empty.outlets")} />
                ) : (
                    <DivXScroll className="gap-3">
                        {outlets.map((outlet) => (
                            <OutletCard
                                key={outlet.id}
                                outlet={outlet}
                                numberFormatter={numberFormatter}
                                t={t}
                                tCommon={tCommon}
                            />
                        ))}
                    </DivXScroll>
                )}
            </section>

            {/* Popular Items */}
            {popularItems.length > 0 && (
                <section className="space-y-3">
                    <HomeSectionHeader
                        title={t("sections.popular.title")}
                    />
                    <div className="space-y-2">
                        {popularItems.map((item, index) => (
                            <PopularItemCard
                                key={item.id}
                                item={item}
                                rank={index + 1}
                                numberFormatter={numberFormatter}
                                currencyFormatter={currencyFormatter}
                                t={t}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Promos */}
            {promos.length > 0 && (
                <section className="space-y-3">
                    <HomeSectionHeader
                        title={t("sections.promos.title")}
                    />
                    <DivXScroll className="-mx-4 flex gap-3 px-4 pb-1 md:mx-0 md:px-0">
                        {promos.map((promo) => (
                            <PromoCard
                                key={promo.id}
                                promo={promo}
                                currencyFormatter={currencyFormatter}
                                dateFormatter={dateFormatter}
                                t={t}
                            />
                        ))}
                    </DivXScroll>
                </section>
            )}
        </div>
    )
}

export function HomeContent() {
    const router = useRouter()
    const withLocalizedPath = useLocalizedPath()
    const t = useTranslations("homePage")
    const { setAppBar, resetAppBar } = useAppBarV2()
    const handleSearch = useCallback((query: string) => {
        router.push(withLocalizedPath(`/search?q=${encodeURIComponent(query)}`))
    }, [router, withLocalizedPath])

    useEffect(() => {
        setAppBar({
            title: t("appBarTitle"),
            showSearch: true,
            onSearch: handleSearch,
        })
        return () => resetAppBar()
    }, [resetAppBar, setAppBar, t, handleSearch])

    return <HomeSections />
}