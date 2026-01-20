"use client"

import React, { Suspense, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Gift,
  Heart,
  History,
  LayoutGrid,
  MapPin,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react"

import { HeroCarousel } from "@/components/home/HeroCarousel"
import { DivXScroll } from "@/components/shared/DivXScroll"
import { LoadingState, ErrorState } from "@/components/Base"
import { useHomeSummary } from "@/hooks/useHomeSummary"
import { useTranslations, useLocale } from "@/hooks/useI18n"
import { useAppBarV2 } from "@/context/AppBarContextV2"
import type { HomeSummaryResponse } from "@/types/home"
import HomeSectionHeader from "@/components/home/HomeSectionHeader"
import CategoryCard from "@/components/home/cards/CategoryCard"
import OutletCard from "@/components/home/cards/OutletCard"
import PopularItemCard from "@/components/home/cards/PopularItemCard"
import PromoCard from "@/components/home/cards/PromoCard"
import QuickActionCard from "@/components/home/cards/QuickActionCard"

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

  const summary = data ?? ({} as Partial<HomeSummaryResponse>);

  const stats = useMemo(() => [
    {
      key: "umkm",
      label: t("stats.umkm.label"),
      value: numberFormatter.format(summary.umkm ?? 0),
      icon: Store,
    },
    {
      key: "transactions",
      label: t("stats.transactions.label"),
      value: numberFormatter.format(summary.transactions ?? 0),
      icon: TrendingUp,
    },
    {
      key: "memberships",
      label: t("stats.memberships.label"),
      value: numberFormatter.format(summary.memberships ?? 0),
      icon: Users,
    },
  ], [t, numberFormatter, summary.umkm, summary.transactions, summary.memberships]);

  const quickActions = useMemo(() => [
    { key: "orders", href: "/orders", icon: History },
    { key: "favorites", href: "/favorites", icon: Heart },
    { key: "nearby", href: "/nearby", icon: MapPin },
  ] as const, []);

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
  }), [t]);

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
  } = summary;

  return (
    <div className="space-y-8 pb-20 pt-2">
      <HeroCarousel banners={banners} />

      {/* --- CATEGORIES SECTION --- */}
      <section className="space-y-4" id="categories">
        <HomeSectionHeader title={t("sections.categories.title")} subtitle={t("sections.categories.subtitle")} actionLabel={t("sections.categories.action")} href="/search" icon={<LayoutGrid className="h-4 w-4" />} />
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">{t("empty.categories")}</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* --- FEATURED OUTLETS SECTION --- */}
      <section className="space-y-4" id="featured-outlets">
        <HomeSectionHeader title={t("sections.featured.title")} subtitle={t("sections.featured.subtitle")} actionLabel={t("sections.featured.action")} href="/outlets" icon={<Store className="h-4 w-4" />} />
        {outlets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">{t("empty.outlets")}</div>
        ) : (
          <DivXScroll className="flex gap-2 pb-2 pl-4 pr-8 md:mx-0 md:pl-0 md:pr-0">
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

      {/* --- POPULAR ITEMS SECTION --- */}
      <section className="space-y-4" id="popular-items">
        <HomeSectionHeader
          title={t("sections.popular.title")}
          subtitle={t("sections.popular.subtitle")}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        {popularItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("empty.popular")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {popularItems.map((item) => (
              <PopularItemCard
                key={item.id}
                item={item}
                numberFormatter={numberFormatter}
                currencyFormatter={currencyFormatter}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {/* --- PROMOS SECTION --- */}
      <section className="space-y-4" id="promos">
        <HomeSectionHeader
          title={t("sections.promos.title")}
          subtitle={t("sections.promos.subtitle")}
          icon={<Gift className="h-4 w-4" />}
        />
        {promos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("empty.promos")}
          </div>
        ) : (
          <DivXScroll className="-mx-4 flex gap-3 pb-2 pl-4 pr-8 md:mx-0 md:pl-0 md:pr-0">
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
        )}
      </section>

      {/* --- QUICK ACTIONS SECTION --- */}
      <section className="space-y-4" id="quick-action">
        <HomeSectionHeader
          title={t("sections.quickActions.title")}
          subtitle={t("sections.quickActions.subtitle")}
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.key}
              action={action}
              labels={quickActionLabels[action.key]}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState message="Loading home page..." />}>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const router = useRouter()
  const t = useTranslations("homePage")
  const { setAppBar, resetAppBar } = useAppBarV2()
  const handleSearch = useCallback((query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [router]);

  useEffect(() => {
    setAppBar({
      title: t("appBarTitle"),
      showSearch: true,
      onSearch: handleSearch,
    })

    return () => resetAppBar()
  }, [resetAppBar, setAppBar, t, handleSearch])

  return (
    <div className="space-y-6">
      <HomeSections />
    </div>
  )
}