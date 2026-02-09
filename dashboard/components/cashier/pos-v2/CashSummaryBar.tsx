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
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Rp {fmt.format(data.totalAmount)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
                {data.transactionsCount} transaksi hari ini
            </span>
        </div>
    );
}
