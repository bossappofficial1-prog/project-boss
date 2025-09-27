"use client"

import React from 'react'
import { Gift } from 'lucide-react'
import { ImageRender } from "@/components/shared/Image"
import type { HomePopularItem } from '@/types/home'
import { Messages, NestedKeyOf } from '@/hooks/useI18n'

interface PopularItemCardProps {
    item: HomePopularItem;
    numberFormatter: Intl.NumberFormat;
    currencyFormatter: Intl.NumberFormat;
    t: (key: NestedKeyOf<Messages['homePage']>, values?: Record<string, string | number>) => string;
}

function PopularItemCard({ item, numberFormatter, currencyFormatter, t }: PopularItemCardProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.image ? (
                    <ImageRender src={item.image} alt={item.name} className="h-full w-full object-cover" sizes="56px" />
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
    )
}

export default React.memo(PopularItemCard);

