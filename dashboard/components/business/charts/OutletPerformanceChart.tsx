"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
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
import { Store } from "lucide-react";
import type { OutletPerformanceItem } from "@/lib/apis/business-dashboard";

interface OutletPerformanceChartProps {
    outlets: OutletPerformanceItem[];
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

export function OutletPerformanceChart({ outlets }: OutletPerformanceChartProps) {
    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-popover px-3 py-2.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95">
                    <p className="mb-2 font-semibold text-foreground border-b border-border pb-1.5">
                        {label}
                    </p>
                    <div className="grid gap-1.5">
                        {payload.map((entry) => (
                            <div key={entry.dataKey} className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full shadow-sm"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-muted-foreground">
                                        {entry.dataKey === "revenue" ? "Pendapatan" : "Pesanan"}
                                    </span>
                                </div>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {entry.dataKey === "revenue"
                                        ? fmtCurrency(entry.value as number)
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

    if (!outlets.length) {
        return (
            <Card className="rounded-md xl:col-span-2 border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Store className="h-5 w-5 text-primary" />
                        Performa Outlet
                    </CardTitle>
                    <CardDescription>Top outlet berdasarkan pendapatan dan pesanan.</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[320px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Store className="h-10 w-10 opacity-40" />
                        <p className="text-sm font-medium">Belum ada data outlet</p>
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
                        <Store className="h-5 w-5 text-primary" />
                        Performa Outlet
                    </CardTitle>
                    <CardDescription>Top outlet berdasarkan pendapatan dan pesanan.</CardDescription>
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
                    <BarChart data={outlets} layout="vertical" margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            horizontal={false}
                            strokeOpacity={0.5}
                        />
                        <XAxis
                            type="number"
                            tickFormatter={fmtYAxis}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            width={130}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                        />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} barSize={16} />
                        <Bar dataKey="orders" fill="var(--color-orders)" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
