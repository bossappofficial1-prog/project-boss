"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProofHealthSlice } from "@/lib/apis/admin-dashboard";
import { formatCurrency } from "@/lib/utils";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ProofHealthDonutProps {
    data?: ProofHealthSlice[];
    isLoading: boolean;
}

const STATUS_DETAILS: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Menunggu Bukti", color: "#94a3b8" },
    PROOF_SUBMITTED: { label: "Bukti Masuk", color: "#60a5fa" },
    AWAITING_VERIFICATION: { label: "Butuh Validasi", color: "#fbbf24" },
    SUCCESS: { label: "Terverifikasi", color: "#34d399" },
    REJECTED_MANUAL: { label: "Ditolak", color: "#f87171" },
    FAILED: { label: "Gagal", color: "#ef4444" },
    EXPIRED: { label: "Kedaluwarsa", color: "#d1d5db" },
};

export function ProofHealthDonut({ data = [], isLoading }: ProofHealthDonutProps) {
    const total = data.reduce((sum, slice) => sum + slice.count, 0) || 1;

    return (
        <Card className="border border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Kesehatan bukti pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="status"
                                innerRadius={70}
                                outerRadius={110}
                                stroke="var(--background)"
                            >
                                {data.map((slice) => (
                                    <Cell key={slice.status} fill={STATUS_DETAILS[slice.status]?.color ?? "#cbd5f5"} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, _name, entry) => {
                                    const detail = STATUS_DETAILS[entry.payload?.status as string];
                                    return [
                                        `${value} invoice (${Math.round((value / total) * 100)}%)`,
                                        detail?.label ?? entry.name,
                                    ];
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
                <div className="space-y-3">
                    {data.map((slice) => {
                        const detail = STATUS_DETAILS[slice.status] ?? { label: slice.status, color: "#cbd5f5" };
                        return (
                            <div key={slice.status} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: detail.color }} />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">{detail.label}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(slice.amount)} outstanding</p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {slice.count}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
