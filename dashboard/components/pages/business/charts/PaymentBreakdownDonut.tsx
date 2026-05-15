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
const fmtPct = (v: number, total: number) => total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0%";

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
            <Card className="rounded-md flex-1 border-border/60 shadow-sm overflow-hidden bg-muted/5">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        Metode Pembayaran
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-[180px] items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-8 w-8 opacity-20" />
                        <p className="text-xs font-medium">Belum ada data</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const preferredMethod = data.online >= data.manual ? "Online" : "Manual";

    return (
        <Card className="rounded-md flex-1 gap-0 pt-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 text-xs">
            <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-1.5 rounded-md bg-primary/10">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Metode Pembayaran
                </CardTitle>
                <CardDescription className="text-xs">
                    Preferensi kanal bayar pelanggan.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <ChartContainer config={chartConfig} className="mx-auto h-[200px] w-full">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            strokeWidth={3}
                            stroke="hsl(var(--card))"
                            paddingAngle={4}
                            cornerRadius={6}
                        >
                            {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} className="transition-opacity hover:opacity-80" />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                                    {total}
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider">
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

                <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors group cursor-default">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-4)" }} />
                            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold tabular-nums text-foreground">{fmtNumber(data.online)}</span>
                            <span className="text-[10px] opacity-60">({fmtPct(data.online, total)})</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors group cursor-default">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: "var(--chart-2)" }} />
                            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Manual</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold tabular-nums text-foreground">{fmtNumber(data.manual)}</span>
                            <span className="text-[10px] opacity-60">({fmtPct(data.manual, total)})</span>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-[10px] text-muted-foreground text-center leading-tight border-t border-border/40 pt-3">
                    Pelanggan lebih menyukai metode <span className="font-semibold text-primary">{preferredMethod}</span> untuk bertransaksi.
                </p>
            </CardContent>
        </Card>
    );
}
