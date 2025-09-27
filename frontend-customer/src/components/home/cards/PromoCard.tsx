"use client"

import React from 'react'
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
        <div className="flex min-w-[220px] flex-col gap-2 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-4 text-white shadow-md">
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
                    <p>{t("promos.minPurchase", { amount: currencyFormatter.format(promo.minPurchaseAmount) })}</p>
                )}
                {validUntil && <p>{t("promos.validUntil", { date: validUntil })}</p>}
            </div>
        </div>
    )
}

export default React.memo(PromoCard);
