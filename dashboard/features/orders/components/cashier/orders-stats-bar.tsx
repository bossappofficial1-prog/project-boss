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
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        key: "pendingCount",
        label: "Menunggu",
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    {
        key: "processingCount",
        label: "Diproses",
        icon: Package,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        key: "readyCount",
        label: "Siap Ambil",
        icon: ShoppingBag,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        key: "completedToday",
        label: "Selesai",
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        key: "cancelledToday",
        label: "Batal",
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
    },
    {
        key: "revenueToday",
        label: "Pendapatan",
        icon: Wallet,
        color: "text-primary",
        bg: "bg-primary/10",
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
                        className={`flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 ${item.bg}`}
                    >
                        <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight truncate">
                                {display}
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                {item.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
