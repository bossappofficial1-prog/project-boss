"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, User } from "lucide-react";
import { cn, formatCurrency, formatISOStringDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";

interface RecentOrdersTableProps {
    orders: Array<{
        id: string;
        outletName: string;
        amount: number;
        createdAt: string;
        paymentStatus: string;
        orderStatus: string;
        customerName: string;
    }>;
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
    PAID: { label: "Terbayar", className: "bg-green-500/10 text-green-700 border-green-500/20" },
    AWAITING_PAYMENT: { label: "Menunggu", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
    FAILED: { label: "Gagal", className: "bg-red-500/10 text-red-700 border-red-500/20" },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
    COMPLETED: "Selesai",
    PROCESSING: "Proses",
    PENDING: "Tertunda",
    CANCELLED: "Batal",
};

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "customerName",
            header: "Customer",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground line-clamp-1">{row.original.customerName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">ID: {row.original.id.slice(-6)}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "outletName",
            header: "Outlet",
            cell: ({ row }) => (
                <span className="text-muted-foreground font-medium">{row.original.outletName}</span>
            ),
        },
        {
            accessorKey: "amount",
            header: 'Jumlah',
            cell: ({ row }) => (
                <div className="text-right font-bold tabular-nums text-foreground">
                    {formatCurrency(row.original.amount)}
                </div>
            ),
        },
        {
            accessorKey: "paymentStatus",
            header: 'Pembayaran',
            cell: ({ row }) => {
                const status = PAYMENT_STATUS_MAP[row.original.paymentStatus] || {
                    label: row.original.paymentStatus,
                    className: "bg-gray-100 text-gray-600",
                };
                return (
                    <div className="flex justify-center">
                        <Badge variant="outline" className={cn("rounded-md text-[10px] font-bold px-2 py-0", status.className)}>
                            {status.label}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "orderStatus",
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Badge variant="secondary" className="rounded-md text-[10px] font-semibold bg-muted/50">
                        {ORDER_STATUS_LABEL[row.original.orderStatus] || row.original.orderStatus}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            header: 'Waktu',
            cell: ({ row }) => (
                <div className="flex flex-col items-end">
                    <span className="font-medium text-foreground whitespace-nowrap">{formatISOStringDate(row.original.createdAt)}</span>
                    <span className="text-[10px] text-muted-foreground opacity-60 font-mono">{fmtTime(row.original.createdAt)}</span>
                </div>
            ),
        },
    ];

    return (
        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-card">
            <CardHeader className="border-b border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <Clock className="h-4 w-4" />
                            </div>
                            Pesanan Terbaru
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Aktivitas transaksi terakhir dari seluruh jaringan outlet.
                        </p>
                    </div>
                </div>
            </CardHeader>
            <div className="p-0">
                <DataTable
                    columns={columns}
                    data={orders}
                    searchKey="customerName"
                    searchPlaceholder="Cari pelanggan..."
                    density="compact"
                    pagination={true}
                    pageSize={5}
                    bordered={false}
                    striped={true}
                />
            </div>
        </Card>
    );
}
