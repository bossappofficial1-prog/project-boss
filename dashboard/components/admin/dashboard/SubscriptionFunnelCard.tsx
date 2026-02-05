"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionFunnelSlice } from "@/lib/apis/admin-dashboard";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
    TRIAL: "#c084fc",
    AWAITING_PAYMENT: "#f97316",
    PROOF_SUBMITTED: "#facc15",
    ACTIVE: "#22c55e",
    PAST_DUE: "#fb7185",
    EXPIRED: "#94a3b8",
    SUSPENDED: "#f43f5e",
    CANCELLED: "#475569",
};

export function SubscriptionFunnelCard({ data = [], isLoading }: SubscriptionFunnelCardProps) {
    const funnelData = useMemo(() => {
        return [...data]
            .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
            .map((item) => ({
                ...item,
                color: STATUS_COLORS[item.status] ?? "#64748b",
            }));
    }, [data]);

    return (
        <Card className="border border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Funnel Status Langganan
                </CardTitle>
            </CardHeader>
            <CardContent className="h-full px-2">
                {isLoading ? (
                    <Skeleton className="h-full w-full" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={funnelData}
                            layout="vertical"
                            barGap={4}
                            barCategoryGap={10}
                            margin={{ left: 16, right: 24 }}>
                            <XAxis type="number" hide />

                            <Tooltip
                                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                                formatter={(value: number) => [`${value} Langganan`, "Jumlah"]}
                            />
                            <YAxis
                                type="category"
                                dataKey="label"
                                width={130}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: "#475569", }}
                            />
                            <Bar
                                dataKey="count"
                                radius={[0, 10, 10, 0]}
                                minPointSize={4}
                                label={{
                                    position: "right", formatter: (value: number) => `${value}`, fill: "#0f172a",
                                    fontSize: 12,
                                }}
                            >
                                {funnelData.map((entry) => (
                                    <Cell
                                        key={entry.status}
                                        fill={entry.color}
                                        opacity={entry.status === "ACTIVE" ? 1 : 0.75}
                                    />

                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
