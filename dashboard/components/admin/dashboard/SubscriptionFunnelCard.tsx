"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export interface SubscriptionFunnelSlice {
    status: string;
    label: string;
    count: number;
}

interface SubscriptionFunnelCardProps {
    data?: SubscriptionFunnelSlice[];
    isLoading: boolean;
}

const STATUS_ORDER = [
    "TRIAL",
    "AWAITING_PAYMENT",
    "PROOF_SUBMITTED",
    "ACTIVE",
    "PAST_DUE",
    "EXPIRED",
    "SUSPENDED",
    "CANCELLED",
];

const STATUS_COLORS: Record<string, string> = {
    TRIAL: "#a855f7",           // Purple-500
    AWAITING_PAYMENT: "#f97316", // Orange-500
    PROOF_SUBMITTED: "#eab308",  // Yellow-500
    ACTIVE: "#22c55e",           // Green-500
    PAST_DUE: "#ef4444",         // Red-500
    EXPIRED: "#94a3b8",          // Slate-400
    SUSPENDED: "#be123c",        // Rose-700
    CANCELLED: "#475569",        // Slate-600
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl outline-none ring-0">
                <div className="flex items-center gap-2 mb-1">
                    <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: data.color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {label}
                    </span>
                </div>
                <div className="text-xl font-bold text-popover-foreground">
                    {data.count.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Langganan</span>
                </div>
            </div>
        );
    }
    return null;
};

export function SubscriptionFunnelCard({ data = [], isLoading }: SubscriptionFunnelCardProps) {
    const { chartData, totalCount } = useMemo(() => {
        if (!data) return { chartData: [], totalCount: 0 };

        const sorted = [...data].sort(
            (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
        );

        const processed = sorted.map((item) => ({
            ...item,
            color: STATUS_COLORS[item.status] ?? "#cbd5e1",
            label: item.label || item.status,
        }));

        const total = data.reduce((acc, curr) => acc + curr.count, 0);

        return { chartData: processed, totalCount: total };
    }, [data]);

    return (
        <Card className="flex flex-col h-[33rem] border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 space-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                            Status Langganan
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Distribusi status funnel user saat ini.
                        </CardDescription>
                    </div>
                    {/* Summary Badge */}
                    {!isLoading && (
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                {totalCount.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                Total
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-[400px] px-2 sm:px-4 pb-6 pt-2">
                {isLoading ? (
                    <div className="flex flex-col justify-between h-full w-full py-4 space-y-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-6 flex-1 rounded-r-md rounded-l-none" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            barSize={32} // Ukuran bar diperbesar agar lebih "berisi"
                            barGap={2}
                            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                        >
                            <XAxis type="number" hide />

                            <YAxis
                                type="category"
                                dataKey="label"
                                width={140} // Diperlebar untuk label panjang seperti "Menunggu Pembayaran"
                                tickLine={false}
                                axisLine={false}
                                interval={0} // Force show all labels
                                tick={{
                                    fontSize: 12,
                                    fill: "var(--muted-foreground)",
                                    fontWeight: 500,
                                    textAnchor: 'end', // Rata kanan agar nempel ke bar
                                    dx: -10 // Jarak sedikit dari bar
                                }}
                            />

                            <Tooltip
                                cursor={{ fill: "var(--accent)", opacity: 0.15 }}
                                content={<CustomTooltip />}
                            />

                            <Bar
                                dataKey="count"
                                radius={[0, 4, 4, 0]}
                                background={{ fill: "var(--muted)", opacity: 0.3, radius: 4 }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        fillOpacity={entry.status === "ACTIVE" ? 1 : 0.85}
                                        strokeWidth={0}
                                    />
                                ))}
                                {/* Label angka di ujung kanan bar */}
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    fill="var(--foreground)"
                                    fontSize={12}
                                    fontWeight={600}
                                    offset={10}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}