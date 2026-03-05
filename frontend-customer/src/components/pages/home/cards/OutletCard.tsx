"use client"

import React from 'react'
import Link from 'next/link'
import { Store, MapPin } from 'lucide-react'
import { ImageColorThief } from '@/components/shared/ImageColorThief'
import type { HomeOutletSummary } from '@/types/home'
import { useLocalizedPath, type Messages, type NestedKeyOf } from '@/hooks/useI18n'

interface OutletCardProps {
    outlet: HomeOutletSummary;
    numberFormatter: Intl.NumberFormat;
    t: (key: NestedKeyOf<Messages['homePage']>, values?: Record<string, string | number>) => string;
    tCommon: (key: NestedKeyOf<Messages['common']>) => string;
}

function OutletCard({ outlet, numberFormatter, t, tCommon }: OutletCardProps) {
    const withLocalizedPath = useLocalizedPath()

    const ordersCount = outlet._count?.orders ?? 0
    const ordersLabel = ordersCount > 0
        ? t("sections.featured.orders", { count: numberFormatter.format(ordersCount) })
        : t("sections.featured.new")
    const distanceLabel = typeof outlet.distance === "number"
        ? outlet.distance >= 1
            ? `${outlet.distance.toFixed(1)} ${tCommon("km")}`
            : `${Math.round(outlet.distance * 1000)} ${tCommon("m")}`
        : null

    const href = withLocalizedPath(`/outlet/${outlet.slug}`)

    return (
        <Link
            href={href}
            className="group flex w-[200px] flex-none flex-col overflow-hidden rounded-xl bg-card transition-all active:scale-[0.98]"
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                {outlet.image ? (
                    <ImageColorThief
                        src={outlet.image}
                        alt={outlet.name}
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="200px"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Store className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                )}
                {/* Status pill */}
                <div className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${outlet.isOpen
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/90 text-muted-foreground backdrop-blur-sm'
                    }`}>
                    {outlet.isOpen ? tCommon("open") : tCommon("closed")}
                </div>
            </div>
            <div className="flex flex-col gap-1 px-1 pt-2 pb-1">
                <p className="text-sm font-semibold leading-snug text-foreground line-clamp-1">{outlet.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="text-primary/80 font-medium">{ordersLabel}</span>
                    {distanceLabel && (
                        <>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {distanceLabel}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default React.memo(OutletCard)

