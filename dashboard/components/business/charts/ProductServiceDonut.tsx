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

interface ProductServiceDonutProps {
    products: number;
    services: number;
}

const chartConfig = {
    products: { label: "Produk", color: "var(--chart-1)" },
    services: { label: "Layanan", color: "var(--chart-5)" },
} satisfies ChartConfig;

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

export function ProductServiceDonut({ products, services }: ProductServiceDonutProps) {
    const total = products + services;

    const data = useMemo(
        () => [
            { name: "Produk", value: products, fill: "var(--color-products)" },
            { name: "Layanan", value: services, fill: "var(--color-services)" },
        ],
        [products, services]
    );

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
            <Card className="rounded-md border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
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
        <Card className="rounded-md border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Produk vs Layanan
                </CardTitle>
                <CardDescription>Distribusi item aktif di seluruh outlet.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <ChartContainer config={chartConfig} className="mx-auto h-[260px] w-full max-w-[280px]">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={72}
                            outerRadius={105}
                            strokeWidth={2}
                            stroke="hsl(var(--card))"
                            paddingAngle={3}
                            cornerRadius={5}
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

                {/* Custom legend */}
                <div className="mt-2 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                        <span className="text-muted-foreground">Produk</span>
                        <span className="font-semibold text-foreground">{fmtNumber(products)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--chart-5)" }} />
                        <span className="text-muted-foreground">Layanan</span>
                        <span className="font-semibold text-foreground">{fmtNumber(services)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
