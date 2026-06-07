"use client";

import { TrendingUp, Wallet, Sparkles, Building2, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumberCompactID } from "@/lib/utils";
import type { DashboardSnapshot } from "@/lib/apis/admin-dashboard";

interface KpiCardsProps {
    snapshot?: DashboardSnapshot;
    isLoading: boolean;
}

const ICON_MAP = {
    revenue: TrendingUp,
    outstanding: Wallet,
    subscription: Sparkles,
    active: Building2,
    pending: ShieldAlert,
};

export function KpiCards({ snapshot, isLoading }: KpiCardsProps) {
    const items = [
        {
            key: "revenue",
            title: "Pendapatan Terkonfirmasi",
            value: snapshot?.totalRevenue ?? 0,
            formatter: (value: number) => formatCurrency(value, { maximumFractionDigits: 0 }),
            trend: "+12% vs periode lalu",
        },
        {
            key: "outstanding",
            title: "Bukti Belum Clear",
            value: snapshot?.outstandingRevenue ?? 0,
            formatter: (value: number) => formatCurrency(value, { maximumFractionDigits: 0 }),
            trend: "Perlu follow-up",
        },
        {
            key: "subscription",
            title: "Langganan Baru",
            value: snapshot?.newSubscriptions ?? 0,
            formatter: (value: number) => `${formatNumberCompactID(value)} bisnis`,
            trend: "Aktif minggu ini",
        },
        {
            key: "active",
            title: "Bisnis Aktif",
            value: snapshot?.activeBusinesses ?? 0,
            formatter: (value: number) => `${formatNumberCompactID(value)} merchants`,
            trend: "On platform",
        },
        {
            key: "pending",
            title: "Butuh Validasi",
            value: snapshot?.pendingProofs ?? 0,
            formatter: (value: number) => `${value} invoice`,
            trend: "Segera cek bukti",
        },
    ];

    return (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {items.map((item) => {
                const Icon = ICON_MAP[item.key as keyof typeof ICON_MAP];
                return (
                    <Card key={item.key} className="border border-border/60 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {item.title}
                            </CardTitle>
                            <div className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                                <Icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <p className="text-2xl font-semibold text-foreground">{item.formatter(item.value)}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">{item.trend}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
