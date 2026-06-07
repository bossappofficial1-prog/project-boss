"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import type { AdminDashboardInterval, RevenueTrendPoint } from "@/lib/apis/admin-dashboard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Info } from "lucide-react";

interface RevenueTrendProps {
    data?: RevenueTrendPoint[];
    interval: AdminDashboardInterval;
    isLoading: boolean;
    className?: string;
}

const formatBucketLabel = (bucket: string, interval: AdminDashboardInterval) => {
    const date = new Date(bucket);
    if (isNaN(date.getTime())) return bucket;

    switch (interval) {
        case "day":
            return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        case "week":
            return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
        case "month":
            return date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        default:
            return bucket;
    }
};

const formatYAxis = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
    return value.toString();
};

export function RevenueTrend({ data = [], interval, isLoading, className }: RevenueTrendProps) {
    const chartData = useMemo(
        () =>
            data.map((point) => ({
                ...point,
                label: formatBucketLabel(point.bucket, interval),
                fullDate: new Date(point.bucket).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })
            })),
        [data, interval]
    );

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const currentItem = payload[0].payload;
            return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95">
                    <p className="mb-2 font-medium text-foreground border-b border-border pb-1">
                        {currentItem.fullDate || label}
                    </p>
                    <div className="grid gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                                <span className="text-muted-foreground">Pendapatan</span>
                            </div>
                            <span className="font-semibold tabular-nums text-foreground">
                                {formatCurrency(payload[0].value as number)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                <span className="text-muted-foreground">Tagihan</span>
                            </div>
                            <span className="font-medium text-muted-foreground tabular-nums">
                                {formatCurrency(payload[1].value as number)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const gradientIdPaid = `colorPaid-${interval}`;
    const gradientIdBilled = `colorBilled-${interval}`;

    return (
        <Card className={cn("col-span-2 flex flex-col border-border/60 shadow-sm overflow-hidden", className)}>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/40 bg-muted/20">
                <div className="space-y-1">
                    <CardTitle className="text-xl">Tren Pendapatan</CardTitle>
                    <CardDescription>
                        Monitor arus kas masuk vs tagihan terkirim ({interval === "day" ? "Harian" : interval === "week" ? "Mingguan" : "Bulanan"})
                    </CardDescription>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                        <span className="text-foreground">Terbayar</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-400 opacity-80" />
                        <span className="text-muted-foreground">Ditagihkan</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {isLoading ? (
                    <div className="flex h-[310px] flex-col space-y-3">
                        <Skeleton className="h-full w-full rounded-xl" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex h-[310px] w-full flex-col items-center justify-center gap-2 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
                        <Info className="h-8 w-8 opacity-50" />
                        <p className="text-sm font-medium">Belum ada data transaksi</p>
                    </div>
                ) : (
                    <div className="h-[310px] w-full text-muted-foreground">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={gradientIdPaid} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                                    </linearGradient>
                                    <linearGradient id={gradientIdBilled} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                    vertical={false}
                                    strokeOpacity={0.5}
                                />

                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={12}
                                    minTickGap={30}
                                    tick={{ fontSize: 11, fill: "currentColor" }}
                                />

                                <YAxis
                                    tickFormatter={formatYAxis}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={12}
                                    tick={{ fontSize: 11, fill: "currentColor" }}
                                />

                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="billedAmount"
                                    stroke="#38bdf8"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#${gradientIdBilled})`}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="paidAmount"
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#${gradientIdPaid})`}
                                    activeDot={{ r: 6, strokeWidth: 4, stroke: "var(--background)" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}