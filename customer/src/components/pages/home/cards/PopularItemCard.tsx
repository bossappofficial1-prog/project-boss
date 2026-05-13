"use client"

import React from 'react'
import { Gift } from 'lucide-react'
import { ImageRender } from "@/components/shared/Image"
import type { HomePopularItem } from '@/types/home'
import { Messages, NestedKeyOf, useLocalizedPath } from '@/hooks/useI18n'
import Link from 'next/link'

interface PopularItemCardProps {
    item: HomePopularItem;
    rank: number;
    numberFormatter: Intl.NumberFormat;
    currencyFormatter: Intl.NumberFormat;
    t: (key: NestedKeyOf<Messages['homePage']>, values?: Record<string, string | number>) => string;
}

function PopularItemCard({ item, rank, numberFormatter, currencyFormatter, t }: PopularItemCardProps) {
    const withLocalizedPath = useLocalizedPath()
    const href = withLocalizedPath(`/outlet/${item.slug}/product/${item.id}?from=home`)

    return (
        <Link href={href} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/30 active:bg-muted/50">
            {/* Rank number */}
            <span className={`flex-shrink-0 w-6 text-center text-xs font-bold tabular-nums sm:text-sm ${rank <= 3 ? 'text-primary' : 'text-muted-foreground/50'}`}>
                {rank}
            </span>
            {/* Image */}
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                    <ImageRender src={item.image} alt={item.name} className="h-full w-full object-cover" sizes="48px" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <Gift className="h-5 w-5" />
                    </div>
                )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-[13px] font-medium leading-snug text-foreground sm:text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                    {t("badges.sold", { count: numberFormatter.format(item.soldCount ?? 0) })}
                </p>
            </div>
            {/* Price */}
            <span className="flex-shrink-0 text-[13px] font-semibold text-primary tabular-nums sm:text-sm">
                {currencyFormatter.format(item.price ?? 0)}
            </span>
        </Link>
    )
}

export default React.memo(PopularItemCard)

