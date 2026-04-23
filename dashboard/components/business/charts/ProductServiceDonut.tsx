"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell, Tooltip, Label } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductServiceDonutProps {
    products: number;
    services: number;
}

const chartConfig = {
    products: { label: "Produk", color: "var(--chart-1)" },
    services: { label: "Layanan", color: "var(--chart-5)" },
} satisfies ChartConfig;

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);
const fmtPct = (v: number, total: number) => total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0%";

export function ProductServiceDonut({ products, services }: ProductServiceDonutProps) {
    const total = products + services;

    const data = useMemo(
        () => [
            { name: "Produk", value: products, fill: "var(--color-products)", icon: "package" },
            { name: "Layanan", value: services, fill: "var(--color-services)", icon: "wrench" },
        ],
        [products, services]
    );

    const dominantCategory = products >= services ? "Produk" : "Layanan";
    const dominantPct = total > 0 ? ((Math.max(products, services) / total) * 100).toFixed(0) : "0";

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center gap-2 mb-1">
                        <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.payload.fill }}
                        />
                        <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-4">
                            <span>Jumlah:</span>
                            <span className="font-medium text-foreground">{fmtNumber(item.value)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Porsi:</span>
                            <span className="font-medium text-foreground">{pct}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (total === 0) {
        return (
            <Card className="rounded-md gap-0 py-0 xl:col-span-2 border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        Produk vs Layanan
                    </CardTitle>
                    <CardDescription>Distribusi item aktif di seluruh outlet.</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-10 w-10 opacity-40" />
                        <p className="text-sm font-medium">Belum ada data</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                        </div>
                        Komposisi Katalog
                    </CardTitle>
                    <CardDescription>Produk vs Layanan</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-6 flex flex-col h-full">
                <ChartContainer config={chartConfig} className="mx-auto h-[320px] w-full">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={85}
                            outerRadius={125}
                            strokeWidth={5}
                            stroke="hsl(var(--card))"
                            paddingAngle={4}
                            cornerRadius={8}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} className="transition-opacity hover:opacity-80" />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                                                    {fmtNumber(total)}
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground text-xs">
                                                    Total Item
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                {/* Detailed Legend */}
                <div className="mt-6 space-y-2.5">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors group cursor-default">
                        <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-1)" }} />
                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Produk</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold tabular-nums text-foreground">{fmtNumber(products)}</span>
                            <Badge variant="outline" className="text-[10px] h-4.5 px-1 bg-background/50">{fmtPct(products, total)}</Badge>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors group cursor-default">
                        <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-5)" }} />
                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Layanan</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold tabular-nums text-foreground">{fmtNumber(services)}</span>
                            <Badge variant="outline" className="text-[10px] h-4.5 px-1 bg-background/50">{fmtPct(services, total)}</Badge>
                        </div>
                    </div>
                </div>

                {/* Automation Insight */}
                <div className="mt-6 pt-4 border-t border-border/40">
                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                        <span className="font-semibold text-primary">{dominantCategory}</span> mendominasi inventori Anda sebesar <span className="font-semibold text-foreground">{dominantPct}%</span> dari total item aktif.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
