"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    TooltipProps,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Store, Trophy, Info } from "lucide-react";
import type { OutletPerformanceItem } from "@/lib/apis/business-dashboard";
import { cn, formatCurrency, formatNumberCompactID } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OutletPerformanceChartProps {
    outlets: OutletPerformanceItem[];
}

const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
    orders: { label: "Pesanan", color: "var(--chart-5)" },
} satisfies ChartConfig;

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

export function OutletPerformanceChart({ outlets }: OutletPerformanceChartProps) {
    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                    <p className="mb-2 text-xs font-bold text-foreground uppercase tracking-tight border-b border-border/40 pb-1">
                        {label}
                    </p>
                    <div className="space-y-1.5">
                        {payload.map((entry: any) => (
                            <div key={entry.dataKey} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: entry.color }} 
                                    />
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                        {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
                                    </span>
                                </div>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {entry.dataKey === "revenue"
                                        ? formatCurrency(entry.value as number)
                                        : fmtNumber(entry.value as number)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const topOutlet = [...outlets].sort((a, b) => b.revenue - a.revenue)[0];

    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-md bg-chart-1/10">
                            <Store className="h-4 w-4 text-chart-1" />
                        </div>
                        Performa Outlet
                    </CardTitle>
                    <CardDescription>Perbandingan kinerja antar lokasi outlet.</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                        <span className="text-foreground font-semibold">Pendapatan</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-5)" }} />
                        <span className="text-muted-foreground">Pesanan</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-8">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart 
                        data={outlets} 
                        margin={{ left: 10, right: 10, top: 20, bottom: 0 }}
                        syncId="businessDashboard"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                            strokeOpacity={0.5}
                        />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "var(--foreground)", fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            tickFormatter={formatNumberCompactID}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                        />
                        <Bar 
                            yAxisId="left"
                            dataKey="revenue" 
                            fill="var(--color-revenue)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={32} 
                            activeBar={{ fill: "var(--color-revenue)", opacity: 0.8 }}
                        />
                        <Bar 
                            yAxisId="right"
                            dataKey="orders" 
                            fill="var(--color-orders)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={32} 
                            activeBar={{ fill: "var(--color-orders)", opacity: 0.8 }}
                        />
                    </BarChart>
                </ChartContainer>

                {topOutlet && (
                    <div className="mt-6 flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                        <Trophy className="h-4 w-4 text-green-600 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">{topOutlet.name}</span> adalah kontributor terbesar periode ini dengan total pendapatan <span className="font-bold text-green-600">{formatCurrency(topOutlet.revenue)}</span>.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
