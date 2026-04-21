"use client";

import React from "react";
import { Clock, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2RecentOrder } from "@/lib/apis/pos-v2";
import { usePrint } from "@/hooks/use-print";

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
    const { handlePrintReceipt } = usePrint()

    const handlePrint = async (orderId: string) => {
        setPrintingId(orderId);
        await handlePrintReceipt(orderId)
        setPrintingId(null);
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
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground uppercase font-medium border border-dashed border-border rounded-md">
                Belum ada transaksi hari ini
            </div>
        );
    }

    return (
        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                                {order.customerName}
                            </p>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                <Clock className="h-3 w-3" />
                                {timeFmt.format(new Date(order.createdAt))}
                            </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                            {order.itemsSummary} ({order.itemCount} item)
                        </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                        Rp {fmt.format(order.totalAmount)}
                    </p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        disabled={printingId === order.id}
                        onClick={() => handlePrint(order.id)}>
                        <Printer className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
