"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowUpRight, Store } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

interface LeaderboardTableProps {
    outlets: Array<{
        id: string;
        name: string;
        revenue: number;
        orders: number;
        products: number;
        services: number;
    }>;
}

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

export function LeaderboardTable({ outlets }: LeaderboardTableProps) {
    const columns: ColumnDef<any>[] = [
        {
            id: "rank",
            header: "#",
            accessorKey: 'id',
            cell: ({ row }) => {
                const idx = row.index;
                return (
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-amber-500/20 text-amber-700" :
                        idx === 1 ? "bg-slate-400/20 text-slate-700" :
                            idx === 2 ? "bg-orange-400/20 text-orange-700" : "bg-muted text-muted-foreground"
                        }`}>
                        {idx + 1}
                    </div>
                );
            },
            size: 40,
        },
        {
            accessorKey: "name",
            header: "Outlet",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{row.original.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{row.original.orders} pesanan</span>
                </div>
            ),
        },
        {
            accessorKey: "revenue",
            header: 'Pendapatan',
            cell: ({ row }) => {
                const idx = row.index;
                return (
                    <div className="flex items-center justify-end gap-1 font-bold tabular-nums text-foreground">
                        {formatCurrency(row.original.revenue)}
                        {idx === 0 && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                    </div>
                );
            },
        },
        {
            accessorKey: "orders",
            header: 'Pesanan',
            cell: ({ row }) => <div className="text-right tabular-nums">{fmtNumber(row.original.orders)}</div>,
        },
        {
            accessorKey: "products",
            header: 'Produk',
            cell: ({ row }) => <div className="text-right tabular-nums">{fmtNumber(row.original.products)}</div>,
        },
        {
            accessorKey: "services",
            header: 'Layanan',
            cell: ({ row }) => <div className="text-right tabular-nums">{fmtNumber(row.original.services)}</div>,
        },
    ];

    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-card">
            <CardHeader className="border-b border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                                <Trophy className="h-4 w-4" />
                            </div>
                            Leaderboard Outlet
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Peringkat performa outlet berdasarkan pendapatan tertinggi.
                        </p>
                    </div>
                </div>
            </CardHeader>
            <div className="p-0">
                <DataTable
                    columns={columns}
                    data={outlets}
                    searchKey="name"
                    searchPlaceholder="Cari outlet..."
                    density="compact"
                    pagination={false}
                    bordered={false}
                    striped={true}
                />
            </div>
        </Card>
    );
}
