"use client"

import React, { Suspense, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  CupSoda,
  Gift,
  Heart,
  History,
  LayoutGrid,
  MapPin,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"

import { HeroCarousel } from "@/components/home/HeroCarousel"
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader"
import { ImageRender } from "@/components/shared/Image"
import { DivXScroll } from "@/components/shared/DivXScroll"
import { LoadingState, ErrorState } from "@/components/Base"
import { useHomeSummary } from "@/hooks/useHomeSummary"
import { useTranslations, useLocale } from "@/hooks/useI18n"
import { useAppBarV2 } from "@/context/AppBarContextV2"
import type { HomeSummaryResponse } from "@/types/home"

const categoryIcons: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  drink: CupSoda,
  shop: ShoppingBag,
  service: Sparkles,
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

  if (isLoading) return <LoadingState message={t("loading")} />
  if (error)
    return (
      <ErrorState
        onRetry={() => refetch()}
        message={error.message === "Network Error" ? t("error.network") : t("error.generic")}
      />
    )

  const summary =
    data ??
    ({
      umkm: 0,
      transactions: 0,
      memberships: 0,
      outlets: [],
      banners: [],
      categories: [],
      popularItems: [],
      promos: [],
    } as HomeSummaryResponse)

  const stats = [
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
  ]

  const quickActions: Array<{ key: "orders" | "favorites" | "nearby"; href: string; icon: LucideIcon }> = [
    {
      key: "orders",
      href: "/orders",
      icon: History,
    },
    {
      key: "favorites",
      href: "/favorites",
      icon: Heart,
    },
    {
      key: "nearby",
      href: "/nearby",
      icon: MapPin,
    },
  ]

  const quickActionLabels = {
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
  }

  return (
    <div className="space-y-8 pb-20 pt-2">
      <HeroCarousel banners={summary.banners} />

      <section className="space-y-4">
        <HomeSectionHeader
          title={t("stats.title")}
          subtitle={t("stats.subtitle")}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <div className="grid grid-cols-3 gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.key} className="flex flex-col gap-1 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-base font-semibold text-foreground">{stat.value}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <HomeSectionHeader
          title={t("sections.categories.title")}
          subtitle={t("sections.categories.subtitle")}
          actionLabel={t("sections.categories.action")}
          href="/search"
          icon={<LayoutGrid className="h-4 w-4" />}
        />
        {summary.categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("empty.categories")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.categories.map((category) => {
              const Icon = categoryIcons[category.slug] ?? LayoutGrid
              return (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.slug)}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{category.title}</span>
                  {category.description && (
                    <span className="text-xs leading-snug text-muted-foreground line-clamp-2">{category.description}</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <HomeSectionHeader
          title={t("sections.featured.title")}
          subtitle={t("sections.featured.subtitle")}
          actionLabel={t("sections.featured.action")}
          href="/outlets"
          icon={<Store className="h-4 w-4" />}
        />
        {summary.outlets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("empty.outlets")}
          </div>
        ) : (
          <DivXScroll className="-mx-4 flex gap-4 pb-2 pl-4 pr-8 md:mx-0 md:pl-0 md:pr-0">
            {summary.outlets.map((outlet) => {
              const ordersCount = outlet._count?.orders ?? 0
              const ordersLabel = ordersCount > 0
                ? t("sections.featured.orders", { count: numberFormatter.format(ordersCount) })
                : t("sections.featured.new")
              const distanceLabel = typeof outlet.distance === "number"
                ? outlet.distance >= 1
                  ? `${outlet.distance.toFixed(1)} ${tCommon("km")}`
                  : `${Math.round(outlet.distance * 1000)} ${tCommon("m")}`
                : null

              return (
                <Link
                  key={outlet.id}
                  href={`/outlet/${outlet.id}`}
                  className="group flex w-[220px] flex-none flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-32 w-full overflow-hidden">
                    {outlet.image ? (
                      <ImageRender
                        src={outlet.image}
                        alt={outlet.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        sizes="220px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Store className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
                      {outlet.isOpen ? tCommon("open") : tCommon("closed")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{outlet.name}</p>
                      {outlet.business?.name && (
                        <p className="text-[11px] text-muted-foreground">{outlet.business.name}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-medium text-primary/80">{ordersLabel}</span>
                      {distanceLabel && <span>{distanceLabel}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </DivXScroll>
        )}
      </section>

      <section className="space-y-4">
        <HomeSectionHeader
          title={t("sections.popular.title")}
          subtitle={t("sections.popular.subtitle")}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        {summary.popularItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("empty.popular")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {summary.popularItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-muted">
                  {item.image ? (
                    <ImageRender
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Gift className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("badges.sold", { count: numberFormatter.format(item.soldCount ?? 0) })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary/90">
                  {currencyFormatter.format(item.price ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <HomeSectionHeader
          title={t("sections.promos.title")}
          subtitle={t("sections.promos.subtitle")}
          icon={<Gift className="h-4 w-4" />}
        />
        {summary.promos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("empty.promos")}
          </div>
        ) : (
          <DivXScroll className="-mx-4 flex gap-3 pb-2 pl-4 pr-8 md:mx-0 md:pl-0 md:pr-0">
            {summary.promos.map((promo) => {
              const valueLabel = promo.type === "PERCENTAGE" ? `${promo.value}%` : currencyFormatter.format(promo.value)
              const validUntil = promo.validUntil ? dateFormatter.format(new Date(promo.validUntil)) : null
              return (
                <div
                  key={promo.id}
                  className="flex min-w-[220px] flex-col gap-2 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-4 text-white shadow-md"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/80">
                    <span>{t("promos.badge")}</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {valueLabel}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold leading-snug">{promo.code}</p>
                    {promo.description && (
                      <p className="text-xs text-white/80 line-clamp-3">{promo.description}</p>
                    )}
                  </div>
                  <div className="mt-auto space-y-1 text-[11px] text-white/80">
                    {promo.minPurchaseAmount && (
                      <p>
                        {t("promos.minPurchase", {
                          amount: currencyFormatter.format(promo.minPurchaseAmount),
                        })}
                      </p>
                    )}
                    {validUntil && <p>{t("promos.validUntil", { date: validUntil })}</p>}
                  </div>
                </div>
              )
            })}
          </DivXScroll>
        )}
      </section>

      <section className="space-y-4">
        <HomeSectionHeader
          title={t("sections.quickActions.title")}
          subtitle={t("sections.quickActions.subtitle")}
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.key}
                href={action.href}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {quickActionLabels[action.key].title}
                  </p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {quickActionLabels[action.key].description}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </Link>
            )
          })}
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

  useEffect(() => {
    setAppBar({
      title: t("appBarTitle"),
      showSearch: true,
      onSearch: (query: string) => router.push(`/search?q=${encodeURIComponent(query)}`),
    })

    return () => resetAppBar()
  }, [resetAppBar, router, setAppBar, t])

  return (
    <div className="space-y-6">
      <HomeSections />
    </div>
  )
}

