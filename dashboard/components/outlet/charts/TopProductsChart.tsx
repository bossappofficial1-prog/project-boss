"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ShoppingBag, TrendingUp, Info } from "lucide-react";
import { formatCurrency, formatNumberCompactID } from "@/lib/utils";

interface TopProductsData {
    name: string;
    revenue: number;
    sales: number;
}

interface TopProductsChartProps {
    data: TopProductsData[];
}

const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
    sales: { label: "Terjual", color: "var(--chart-2)" },
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
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-chart-2" />
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Unit Terjual</span>
                        </div>
                        <span className="font-bold text-foreground">{payload[1].value} item</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function TopProductsChart({ data }: TopProductsChartProps) {
    const topProduct = data[0];

    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-chart-2/10">
                            <ShoppingBag className="h-4 w-4 text-chart-2" />
                        </div>
                        Produk Terlaris
                    </CardTitle>
                    <CardDescription className="text-xs">Produk dengan performa penjualan tertinggi.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-chart-1" />
                        <span className="text-[10px] font-semibold">Pendapatan</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-8">
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <BarChart
                        data={data}
                        margin={{ left: 10, right: 10, top: 20, bottom: 0 }}
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
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            interval={0}
                            tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 10)}...` : value}
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
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                        <Bar
                            yAxisId="left"
                            dataKey="revenue"
                            fill="var(--color-revenue)"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="sales"
                            fill="var(--color-sales)"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ChartContainer>

                {topProduct && (
                    <div className="mt-6 flex items-center gap-3 p-3 rounded-lg bg-chart-2/5 border border-chart-2/10">
                        <TrendingUp className="h-4 w-4 text-chart-2 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">{topProduct.name}</span> mendominasi dengan total penjualan <span className="font-bold text-chart-2">{topProduct.sales} item</span> periode ini.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
