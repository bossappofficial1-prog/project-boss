"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PosV2CashSummary } from "@/lib/apis/pos-v2";

interface CashSummaryBarProps {
    data: PosV2CashSummary | undefined;
    isLoading: boolean;
}

const fmt = new Intl.NumberFormat("id-ID");

export function CashSummaryBar({ data, isLoading }: CashSummaryBarProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-2.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-2.5">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">
                Rp {fmt.format(data.totalAmount)}
            </span>
            <span className="text-xs text-muted-foreground">
                {data.transactionsCount} transaksi hari ini
            </span>
        </div>
    );
}
