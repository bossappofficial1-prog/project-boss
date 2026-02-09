"use client";

import React from "react";
import { Clock, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2RecentOrder } from "@/lib/apis/pos-v2";

interface RecentOrdersProps {
    orders: PosV2RecentOrder[] | undefined;
    isLoading: boolean;
}

const fmt = new Intl.NumberFormat("id-ID");
const timeFmt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
});

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
    const [printingId, setPrintingId] = React.useState<string | null>(null);

    const handlePrint = async (orderId: string) => {
        setPrintingId(orderId);
        try {
            const blob = await posV2Api.getReceipt(orderId);
            const url = URL.createObjectURL(blob);

            const printWindow = window.open(url, "_blank", "width=400,height=600");
            if (printWindow) {
                printWindow.addEventListener("load", () => {
                    printWindow.print();
                });
            } else {
                const a = document.createElement("a");
                a.href = url;
                a.download = `receipt-${orderId}.pdf`;
                a.click();
            }

            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch {
            toast.error("Gagal mencetak struk");
        } finally {
            setPrintingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-md" />
                ))}
            </div>
        );
    }

    if (!orders?.length) {
        return (
            <div className="flex h-24 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                Belum ada transaksi hari ini
            </div>
        );
    }

    return (
        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                {order.customerName}
                            </p>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Clock className="h-3 w-3" />
                                {timeFmt.format(new Date(order.createdAt))}
                            </span>
                        </div>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {order.itemsSummary} ({order.itemCount} item)
                        </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Rp {fmt.format(order.totalAmount)}
                    </p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-blue-600"
                        disabled={printingId === order.id}
                        onClick={() => handlePrint(order.id)}>
                        <Printer className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
