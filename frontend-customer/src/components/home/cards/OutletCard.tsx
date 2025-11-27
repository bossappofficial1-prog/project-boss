"use client"

import React from 'react'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { ImageRender } from "@/components/shared/Image"
import type { HomeOutletSummary } from '@/types/home'
import type { Messages, NestedKeyOf } from '@/hooks/useI18n'
import { ImageColorThief } from '@/components/shared/ImageColorThief'

interface OutletCardProps {
    outlet: HomeOutletSummary;
    numberFormatter: Intl.NumberFormat;
    t: (key: NestedKeyOf<Messages['homePage']>, values?: Record<string, string | number>) => string;
    tCommon: (key: NestedKeyOf<Messages['common']>) => string;
}

function OutletCard({ outlet, numberFormatter, t, tCommon }: OutletCardProps) {
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
            href={`/outlet/${outlet.id}`}
            className="group flex w-[220px] flex-none flex-col overflow-hidden rounded-md border border-border/60 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            <div className="relative h-32 w-full overflow-hidden">
                {outlet.image ? (
                    <ImageColorThief
                        src={outlet.image}
                        alt={outlet.name}
                        className="object-cover transition duration-500 group-hover:scale-105"
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
}

export default React.memo(OutletCard)

