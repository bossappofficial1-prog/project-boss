"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProofHealthSlice } from "@/lib/apis/admin-dashboard";
import { formatCurrency } from "@/lib/utils";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Label } from "recharts";
import { useMemo } from "react";

interface ProofHealthDonutProps {
    data?: ProofHealthSlice[];
    isLoading: boolean;
}

const STATUS_DETAILS: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Menunggu Bukti", color: "#94a3b8" }, // Slate 400
    PROOF_SUBMITTED: { label: "Bukti Masuk", color: "#3b82f6" }, // Blue 500
    AWAITING_VERIFICATION: { label: "Butuh Validasi", color: "#eab308" }, // Yellow 500
    SUCCESS: { label: "Terverifikasi", color: "#22c55e" }, // Green 500
    REJECTED_MANUAL: { label: "Ditolak", color: "#ef4444" }, // Red 500
    FAILED: { label: "Gagal", color: "#dc2626" }, // Red 600
    EXPIRED: { label: "Kedaluwarsa", color: "#d1d5db" }, // Gray 300
};

export function ProofHealthDonut({ data = [], isLoading }: ProofHealthDonutProps) {
    const totalCount = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);
    const totalAmount = useMemo(() => data.reduce((sum, item) => sum + item.amount, 0), [data]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataItem = payload[0].payload;
            const detail = STATUS_DETAILS[dataItem.status] || { label: dataItem.status, color: "#ccc" };

            return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: detail.color }} />
                        <span className="font-semibold text-foreground">{detail.label}</span>
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-4">
                            <span>Jumlah:</span>
                            <span className="font-medium text-foreground">{dataItem.count} inv</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Nilai:</span>
                            <span className="font-medium text-foreground">{formatCurrency(dataItem.amount)}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="flex flex-col border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-lg">Kesehatan Bukti Pembayaran</CardTitle>
                <CardDescription>Distribusi status pembayaran saat ini</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <Skeleton className="h-48 w-48 rounded-full" />
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2 lg:items-center h-full mt-4">
                        {/* CHART SECTION */}
                        <div className="relative h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Pie
                                        data={data}
                                        dataKey="count"
                                        nameKey="status"
                                        innerRadius={65}
                                        outerRadius={100}
                                        strokeWidth={2}
                                        stroke="hsl(var(--card))"
                                        paddingAngle={2}
                                        cornerRadius={4}
                                    >
                                        {data.map((slice) => (
                                            <Cell
                                                key={slice.status}
                                                fill={STATUS_DETAILS[slice.status]?.color ?? "#cbd5f5"}
                                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                        {/* Label Tengah */}
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-3xl font-bold"
                                                            >
                                                                {totalCount}
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) + 24}
                                                                className="fill-muted-foreground text-xs"
                                                            >
                                                                Total Invoice
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* LIST / LEGEND SECTION */}
                        <div className="flex flex-col gap-4">
                            <div className="text-center lg:text-left mb-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Nilai Outstanding</span>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
                            </div>

                            <div className="space-y-1">
                                {data.map((slice) => {
                                    const detail = STATUS_DETAILS[slice.status] ?? { label: slice.status, color: "#cbd5f5" };
                                    const percentage = totalCount > 0 ? Math.round((slice.count / totalCount) * 100) : 0;

                                    return (
                                        <div
                                            key={slice.status}
                                            className="group flex items-center justify-between py-2 px-1 hover:bg-muted/50 rounded-md transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Indicator pill */}
                                                <span
                                                    className="h-8 w-1 rounded-full"
                                                    style={{ backgroundColor: detail.color }}
                                                />
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium leading-none text-foreground group-hover:text-primary transition-colors">
                                                        {detail.label}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatCurrency(slice.amount)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground">{slice.count}</p>
                                                <p className="text-[10px] text-muted-foreground">{percentage}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}