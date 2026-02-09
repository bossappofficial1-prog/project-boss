"use client";

import { Activity, Clock, CheckCircle, XCircle, Package, Wallet, ShoppingBag } from "lucide-react";
import type { OrdersV2Stats } from "@/lib/apis/orders-v2";

interface OrdersStatsBarProps {
    stats: OrdersV2Stats;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

const STAT_ITEMS = [
    {
        key: "totalActive",
        label: "Aktif",
        icon: Activity,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
        key: "pendingCount",
        label: "Menunggu",
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
        key: "processingCount",
        label: "Diproses",
        icon: Package,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
        key: "readyCount",
        label: "Siap Ambil",
        icon: ShoppingBag,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
        key: "completedToday",
        label: "Selesai",
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950",
    },
    {
        key: "cancelledToday",
        label: "Batal",
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950",
    },
    {
        key: "revenueToday",
        label: "Pendapatan",
        icon: Wallet,
        color: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-50 dark:bg-teal-950",
        isCurrency: true,
    },
] as const;

export function OrdersStatsBar({ stats }: OrdersStatsBarProps) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STAT_ITEMS.map((item) => {
                const Icon = item.icon;
                const rawValue = stats[item.key as keyof OrdersV2Stats];
                const display = "isCurrency" in item && item.isCurrency
                    ? formatCurrency(rawValue ?? 0)
                    : String(rawValue ?? 0);

                return (
                    <div
                        key={item.key}
                        className={`flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2.5 ${item.bg}`}
                    >
                        <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                {display}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                {item.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
