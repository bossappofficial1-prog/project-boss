"use client";

import React, { useState, useMemo } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Line,
    LineChart,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    type ChartConfig,
} from "@/components/ui/chart";
import { 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    BarChart3, 
    ArrowUpRight,
    Target,
    Zap
} from "lucide-react";
import { useOutletRevenueTrend } from "@/hooks/useOutletRevenueTrend";
import type { TimeframeFilter } from "@/types/outlet";
import { formatCurrency, formatNumberCompactID } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueChartProps {
    outletId: string;
}

const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                <p className="mb-2 text-xs font-bold text-foreground uppercase tracking-tight border-b border-border/40 pb-1">
                    {label}
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-chart-1" />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Pendapatan</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(payload[0].value)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function RevenueChart({ outletId }: RevenueChartProps) {
    const [timeframe, setTimeframe] = useState<TimeframeFilter>("30d");
    const { data: trend, isPending } = useOutletRevenueTrend(outletId, { timeframe });

    const filteredData = trend?.data ?? [];

    const stats = useMemo(() => {
        if (!filteredData.length) return { total: 0, avg: 0, max: 0, maxDate: "" };
        const revenues = filteredData.map(d => d.revenue);
        const total = revenues.reduce((a, b) => a + b, 0);
        const max = Math.max(...revenues);
        const maxItem = filteredData.find(d => d.revenue === max);
        return {
            total,
            avg: total / filteredData.length,
            max,
            maxDate: maxItem?.date || ""
        };
    }, [filteredData]);

    if (isPending) {
        return <Skeleton className="h-[450px] w-full rounded-md" />;
    }

    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 bg-muted/20 p-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-chart-1/10">
                            <TrendingUp className="h-4 w-4 text-chart-1" />
                        </div>
                        Tren Pendapatan
                    </CardTitle>
                    <CardDescription className="text-xs">Pertumbuhan omzet harian outlet Anda.</CardDescription>
                </div>
                <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeFilter)} className="w-auto">
                    <TabsList className="bg-background/50 border border-border/40 h-8">
                        <TabsTrigger value="7d" className="text-[10px] h-6 px-3">7 Hari</TabsTrigger>
                        <TabsTrigger value="30d" className="text-[10px] h-6 px-3">30 Hari</TabsTrigger>
                        <TabsTrigger value="90d" className="text-[10px] h-6 px-3">90 Hari</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            
            <CardContent className="p-0">
                {/* Hero Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b border-border/40 bg-muted/10">
                    <div className="p-4 space-y-1 group">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-emerald-500" /> Total Pendapatan
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
                            {formatCurrency(stats.total)}
                        </p>
                    </div>
                    <div className="p-4 space-y-1 group">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-amber-500" /> Rata-rata Harian
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
                            {formatCurrency(stats.avg)}
                        </p>
                    </div>
                    <div className="p-4 space-y-1 group">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-blue-500" /> Puncak Tertinggi
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
                            {formatCurrency(stats.max)}
                        </p>
                    </div>
                </div>

                {/* Main Chart Section */}
                <div className="p-4 pt-8">
                    <ChartContainer config={chartConfig} className="h-[320px] w-full">
                        <AreaChart data={filteredData} margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.01}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                vertical={false} 
                                stroke="var(--border)" 
                                strokeOpacity={0.5} 
                            />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                                minTickGap={32}
                            />
                            <YAxis
                                tickFormatter={formatNumberCompactID}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-revenue)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ChartContainer>
                </div>

                {/* Insight Footer */}
                {stats.maxDate && (
                    <div className="m-4 mt-2 flex items-center gap-3 p-3 rounded-lg bg-chart-1/5 border border-chart-1/10">
                        <ArrowUpRight className="h-4 w-4 text-chart-1 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Peforma terbaik tercatat pada <span className="font-bold text-foreground">{stats.maxDate}</span> dengan pendapatan <span className="font-bold text-chart-1">{formatCurrency(stats.max)}</span>. 
                            Gunakan data ini untuk merencanakan promosi di hari serupa.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
