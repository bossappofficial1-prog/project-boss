"use client";

import React, { useMemo } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { 
    Scale, 
    ArrowDownRight, 
    ArrowUpRight, 
    TrendingUp, 
    DollarSign,
    Target
} from "lucide-react";
import { formatCurrency, formatNumberCompactID } from "@/lib/utils";

interface ExpenseVsRevenueData {
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
}

interface ExpenseVsRevenueChartProps {
    data: Array<{
        date: string;
        revenue: number;
        expenses: number;
    }>;
    summary: ExpenseVsRevenueData;
}

const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-2)" },
    expenses: { label: "Pengeluaran", color: "var(--chart-5)" },
    profit: { label: "Laba Bersih", color: "var(--chart-1)" },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                <p className="mb-2 text-xs font-bold text-foreground uppercase tracking-tight border-b border-border/40 pb-1">
                    {label}
                </p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Pendapatan</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(payload[0].value)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[var(--chart-5)]" />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Pengeluaran</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(payload[1].value)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8 border-t border-border/40 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Laba Bersih</span>
                        </div>
                        <span className="font-bold text-emerald-600">{formatCurrency(payload[0].value - payload[1].value)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function ExpenseVsRevenueChart({ data, summary }: ExpenseVsRevenueChartProps) {
    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
            <CardHeader className="flex flex-col gap-4 border-b border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <Scale className="h-4 w-4" />
                            </div>
                            Analisis Laba Rugi
                        </CardTitle>
                        <CardDescription className="text-xs">Perbandingan efisiensi operasional harian.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-full border border-border/50 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />
                            <span className="text-[10px] font-semibold">Pendapatan</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-full border border-border/50 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-[var(--chart-5)]" />
                            <span className="text-[10px] font-semibold">Biaya</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Hero Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-b border-border/40 bg-muted/10">
                    <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-emerald-500" /> Pendapatan
                        </p>
                        <p className="text-lg font-bold tabular-nums">{formatCurrency(summary.revenue)}</p>
                    </div>
                    <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <ArrowDownRight className="h-3 w-3 text-red-500" /> Pengeluaran
                        </p>
                        <p className="text-lg font-bold tabular-nums text-red-600">{formatCurrency(summary.expenses)}</p>
                    </div>
                    <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 text-blue-500" /> Laba Bersih
                        </p>
                        <p className="text-lg font-bold tabular-nums text-blue-600">{formatCurrency(summary.netProfit)}</p>
                    </div>
                    <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-purple-500" /> Margin Laba
                        </p>
                        <p className="text-lg font-bold tabular-nums text-purple-600">{summary.profitMargin}%</p>
                    </div>
                </div>

                <div className="p-4 pt-8">
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                        <ComposedChart data={data} margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
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
                            />
                            <YAxis
                                tickFormatter={formatNumberCompactID}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="revenue" 
                                fill="var(--chart-2)" 
                                radius={[4, 4, 0, 0]} 
                                barSize={24}
                                opacity={0.8}
                            />
                            <Bar 
                                dataKey="expenses" 
                                fill="var(--chart-5)" 
                                radius={[4, 4, 0, 0]} 
                                barSize={24}
                                opacity={0.8}
                            />
                            <Line
                                type="monotone"
                                dataKey={(entry) => entry.revenue - entry.expenses}
                                stroke="var(--chart-1)"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 2, stroke: "var(--background)" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                name="Laba Bersih"
                            />
                        </ComposedChart>
                    </ChartContainer>
                </div>

                <div className="m-4 mt-2 flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <ArrowUpRight className="h-4 w-4 text-blue-600 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Margin keuntungan Anda saat ini berada di angka <span className="font-bold text-foreground">{summary.profitMargin}%</span>. 
                        {summary.profitMargin > 30 ? " Bisnis Anda berjalan sangat efisien." : " Pertimbangkan efisiensi biaya operasional."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
