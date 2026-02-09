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
import { CreditCard } from "lucide-react";
import type { PaymentBreakdown } from "@/lib/apis/business-dashboard";

interface PaymentBreakdownDonutProps {
    data: PaymentBreakdown;
}

const chartConfig = {
    online: { label: "Online", color: "var(--chart-4)" },
    manual: { label: "Manual", color: "var(--chart-2)" },
} satisfies ChartConfig;

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

export function PaymentBreakdownDonut({ data }: PaymentBreakdownDonutProps) {
    const total = data.online + data.manual;

    const pieData = useMemo(
        () => [
            { name: "Online", value: data.online, fill: "var(--color-online)" },
            { name: "Manual", value: data.manual, fill: "var(--color-manual)" },
        ],
        [data.online, data.manual]
    );

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload.fill }} />
                        <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-4">
                            <span>Transaksi:</span>
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
            <Card className="rounded-md flex-1 border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Metode Pembayaran
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-[180px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-8 w-8 opacity-40" />
                        <p className="text-xs font-medium">Belum ada data</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-md flex-1 border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Metode Pembayaran
                </CardTitle>
                <CardDescription className="text-xs">
                    Distribusi metode pembayaran sukses.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
                <ChartContainer config={chartConfig} className="mx-auto h-[140px] w-full max-w-[160px]">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={42}
                            outerRadius={62}
                            strokeWidth={2}
                            stroke="hsl(var(--card))"
                            paddingAngle={3}
                            cornerRadius={4}
                        >
                            {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} className="transition-opacity hover:opacity-80" />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                                                    {fmtNumber(total)}
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-[10px]">
                                                    Transaksi
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-4)" }} />
                        <span className="text-muted-foreground">Online</span>
                        <span className="font-semibold text-foreground">{fmtNumber(data.online)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                        <span className="text-muted-foreground">Manual</span>
                        <span className="font-semibold text-foreground">{fmtNumber(data.manual)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
