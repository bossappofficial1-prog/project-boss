"use client";

import { useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceLine,
    Dot,
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
import { TrendingUp, ShoppingBag, Wallet, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { RevenueSeriesItem } from "@/lib/apis/business-dashboard";
import { cn, formatCurrency, formatNumberCompactID } from "@/lib/utils";

interface RevenueTrendChartProps {
    data: RevenueSeriesItem[];
    period: "week" | "month" | "year";
}

const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
    orders: { label: "Pesanan", color: "var(--chart-5)" },
} satisfies ChartConfig;

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

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
    const { chartData, stats } = useMemo(() => {
        const processed = data.map((point) => ({
            ...point,
            label: formatDateLabel(point.date, period),
            fullDate: new Date(point.date).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
        }));

        const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
        const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

        // Find peak performance
        const peakDay = [...data].sort((a, b) => b.revenue - a.revenue)[0];

        // Calculate growth (simple first vs last)
        const firstRevenue = data[0]?.revenue || 0;
        const lastRevenue = data[data.length - 1]?.revenue || 0;
        const growth = firstRevenue > 0 ? ((lastRevenue - firstRevenue) / firstRevenue) * 100 : 0;

        return {
            chartData: processed,
            stats: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                avgRevenue,
                peakDay,
                growth
            }
        };
    }, [data, period]);

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
                                {formatCurrency(payload[0].value as number)}
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
            <Card className="rounded-md gap-0 pt-0 pb-4 xl:col-span-2 border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
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
        <Card className="rounded-md gap-0 pt-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        Tren Pendapatan & Pesanan
                    </CardTitle>
                    <CardDescription>
                        Analisis pertumbuhan harian dari seluruh outlet.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-1)" }} />
                        <span className="text-foreground">Pendapatan</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-5)" }} />
                        <span className="text-muted-foreground">Pesanan</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Hero Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b border-border/40">
                    <div className="p-4 flex flex-col gap-1 hover:bg-muted/30 transition-colors cursor-default group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <Wallet className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                                TOTAL PENDAPATAN
                            </div>
                            {stats.growth !== 0 && (
                                <div className={cn(
                                    "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                    stats.growth > 0 ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"
                                )}>
                                    {stats.growth > 0 ? <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />}
                                    {Math.abs(stats.growth).toFixed(1)}%
                                </div>
                            )}
                        </div>
                        <div className="text-xl font-bold tracking-tight text-foreground">
                            {formatCurrency(stats.totalRevenue)}
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-1 hover:bg-muted/30 transition-colors cursor-default group">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <ShoppingBag className="h-3.5 w-3.5 group-hover:text-chart-5 transition-colors" />
                            TOTAL PESANAN
                        </div>
                        <div className="text-xl font-bold tracking-tight text-foreground">
                            {fmtNumber(stats.totalOrders)}
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-1 hover:bg-muted/30 transition-colors cursor-default group">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <TrendingUp className="h-3.5 w-3.5 group-hover:text-green-500 transition-colors" />
                            RATA-RATA PESANAN (AOV)
                        </div>
                        <div className="text-xl font-bold tracking-tight text-foreground">
                            {formatCurrency(stats.avgOrderValue)}
                        </div>
                    </div>
                </div>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
                        syncId="businessDashboard"
                    >
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
                            tickFormatter={formatNumberCompactID}
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

                        {/* Reference Line for Average */}
                        <ReferenceLine
                            yAxisId="left"
                            y={stats.avgRevenue}
                            stroke="var(--chart-1)"
                            strokeDasharray="5 5"
                            strokeOpacity={0.3}
                            label={{
                                position: 'insideBottomLeft',
                                value: `Avg: ${formatNumberCompactID(stats.avgRevenue)}`,
                                fill: 'var(--chart-1)',
                                fontSize: 9,
                                opacity: 0.6
                            }}
                        />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#${gradientRevenue})`}
                            activeDot={{
                                r: 6,
                                strokeWidth: 2,
                                stroke: "var(--background)",
                                fill: "var(--color-revenue)"
                            }}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            stroke="var(--color-orders)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#${gradientOrders})`}
                            activeDot={{
                                r: 4,
                                strokeWidth: 2,
                                stroke: "var(--background)",
                                fill: "var(--color-orders)"
                            }}
                        />
                    </AreaChart>
                </ChartContainer>

                {/* Insight Footer */}
                {stats.peakDay && (
                    <div className="mt-6 mx-4 flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Pencapaian tertinggi tercapai pada <span className="font-semibold text-foreground">{new Date(stats.peakDay.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span> dengan pendapatan sebesar <span className="font-semibold text-foreground">{formatCurrency(stats.peakDay.revenue)}</span>.
                            Strategi di hari tersebut bisa dipertimbangkan untuk diduplikasi.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
