"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { AdminDashboardInterval, RevenueTrendPoint } from "@/lib/apis/admin-dashboard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RevenueTrendProps {
    data?: RevenueTrendPoint[];
    interval: AdminDashboardInterval;
    isLoading: boolean;
}

const formatBucketLabel = (bucket: string, interval: AdminDashboardInterval) => {
    const date = new Date(bucket);
    switch (interval) {
        case "day":
            return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        case "week":
            return `Minggu ${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
        case "month":
            return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
        default:
            return bucket;
    }
};

export function RevenueTrend({ data = [], interval, isLoading }: RevenueTrendProps) {
    const chartData = useMemo(
        () =>
            data.map((point) => ({
                ...point,
                label: formatBucketLabel(point.bucket, interval),
            })),
        [data, interval]
    );

    return (
        <Card className="col-span-2 border border-border/60 shadow-sm">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cashflow Langganan</p>
                    <CardTitle className="text-2xl">Tren pendapatan</CardTitle>
                </div>
                <div className="text-xs text-muted-foreground">
                    Resolusi {interval === "day" ? "harian" : interval === "week" ? "mingguan" : "bulanan"}
                </div>
            </CardHeader>
            <CardContent className="h-[320px]">
                {isLoading ? (
                    <Skeleton className="h-full w-full" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="rgb(56, 189, 248)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="rgb(56, 189, 248)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.4)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis
                                tickFormatter={(value) => formatCurrency(value, { maximumFractionDigits: 0 })}
                                tick={{ fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                                formatter={(value) => formatCurrency(value as number)}
                                labelFormatter={(label) => label as string}
                            />
                            <Area type="monotone" dataKey="paidAmount" stroke="var(--primary)" fillOpacity={1} fill="url(#colorPaid)" />
                            <Area type="monotone" dataKey="billedAmount" stroke="rgb(56, 189, 248)" fillOpacity={1} fill="url(#colorBilled)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
