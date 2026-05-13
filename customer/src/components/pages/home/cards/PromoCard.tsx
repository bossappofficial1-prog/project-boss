"use client"

import React from 'react'
import { Tag, Clock } from 'lucide-react'
import type { HomePromo } from '@/types/home'

interface PromoCardProps {
    promo: HomePromo;
    currencyFormatter: Intl.NumberFormat;
    dateFormatter: Intl.DateTimeFormat;
    t: any;
}

function PromoCard({ promo, currencyFormatter, dateFormatter, t }: PromoCardProps) {
    const valueLabel = promo.type === "PERCENTAGE" ? `${promo.value}%` : currencyFormatter.format(promo.value)
    const validUntil = promo.validUntil ? dateFormatter.format(new Date(promo.validUntil)) : null

    return (
        <div className="flex min-w-[240px] flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/5" />

            <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-1.5 text-primary">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">{t("promos.badge")}</span>
                </div>
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground sm:text-xs">
                    {valueLabel}
                </span>
            </div>

            <div className="space-y-1 relative">
                <p className="text-sm font-bold tracking-wide text-foreground sm:text-base">{promo.code}</p>
                {promo.description && (
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{promo.description}</p>
                )}
            </div>

            <div className="relative mt-auto space-y-1 text-xs text-muted-foreground">
                {promo.minPurchaseAmount && (
                    <p>{t("promos.minPurchase", { amount: currencyFormatter.format(promo.minPurchaseAmount) })}</p>
                )}
                {validUntil && (
                    <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("promos.validUntil", { date: validUntil })}
                    </p>
                )}
            </div>
        </div>
    )
}

export default React.memo(PromoCard)
