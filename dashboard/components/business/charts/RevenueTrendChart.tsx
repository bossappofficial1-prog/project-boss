"use client";

import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import type { RevenueSeriesItem } from "@/lib/apis/business-dashboard";

interface RevenueTrendChartProps {
    data: RevenueSeriesItem[];
    period: "week" | "month" | "year";
}

const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
    orders: { label: "Pesanan", color: "var(--chart-5)" },
} satisfies ChartConfig;

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(v);

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

const fmtYAxis = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
    return value.toString();
};

const formatDateLabel = (date: string, period: "week" | "month" | "year") => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    switch (period) {
        case "week":
            return d.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" });
        case "month":
            return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        case "year":
            return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    }
};

export function RevenueTrendChart({ data, period }: RevenueTrendChartProps) {
    const chartData = useMemo(
        () =>
            data.map((point) => ({
                ...point,
                label: formatDateLabel(point.date, period),
                fullDate: new Date(point.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            })),
        [data, period]
    );

    const CustomTooltip = ({
        active,
        payload,
    }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="rounded-lg border bg-popover px-3 py-2.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95">
                    <p className="mb-2 font-medium text-foreground border-b border-border pb-1.5">
                        {item.fullDate}
                    </p>
                    <div className="grid gap-1.5">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-1)" }} />
                                <span className="text-muted-foreground">Pendapatan</span>
                            </div>
                            <span className="font-semibold tabular-nums text-foreground">
                                {fmtCurrency(payload[0].value as number)}
                            </span>
                        </div>
                        {payload[1] && (
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-5)" }} />
                                    <span className="text-muted-foreground">Pesanan</span>
                                </div>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {fmtNumber(payload[1].value as number)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const gradientRevenue = `grad-revenue-${period}`;
    const gradientOrders = `grad-orders-${period}`;

    if (!data.length) {
        return (
            <Card className="rounded-md xl:col-span-2 border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Tren Pendapatan & Pesanan
                    </CardTitle>
                    <CardDescription>
                        Performa agregat harian dari seluruh outlet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex h-[320px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-10 w-10 opacity-40" />
                        <p className="text-sm font-medium">Belum ada data tren</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-md xl:col-span-2 border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 pb-3">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Tren Pendapatan & Pesanan
                    </CardTitle>
                    <CardDescription>
                        Performa agregat harian dari seluruh outlet.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-1)" }} />
                        <span className="text-foreground">Pendapatan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-5)" }} />
                        <span className="text-muted-foreground">Pesanan</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-6">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientRevenue} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id={gradientOrders} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.05} />
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
                            minTickGap={24}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                        />
                        <YAxis
                            yAxisId="left"
                            tickFormatter={fmtYAxis}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={fmtNumber}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                        />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={`url(#${gradientRevenue})`}
                            activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--background)" }}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            stroke="var(--color-orders)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#${gradientOrders})`}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
