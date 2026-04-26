"use client";

import React from "react";
import { format } from "date-fns";
import { Clock, User, ArrowRight, LayoutGrid, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PosV2OpenOrder } from "@/lib/apis/pos-v2";

interface OpenOrdersProps {
    orders: PosV2OpenOrder[];
    isLoading: boolean;
    onSelect: (order: PosV2OpenOrder) => void;
}

const fmt = new Intl.NumberFormat("id-ID");

export function OpenOrders({ orders, isLoading, onSelect }: OpenOrdersProps) {
    if (isLoading) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Memuat pesanan tersimpan...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Tidak ada pesanan tersimpan</p>
                    <p className="text-xs text-muted-foreground">Semua bill sudah lunas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {orders.map((order) => {
                const createdAt = new Date(order.createdAt);
                const minutesAgo = Math.floor((Date.now() - createdAt.getTime()) / 60000);
                const waitLabel = minutesAgo < 60
                    ? `${minutesAgo} mnt lalu`
                    : format(createdAt, "HH:mm");

                return (
                    <div
                        key={order.id}
                        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-colors">

                        {/* Top row: customer + total */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-foreground">
                                        {order.customerName}
                                    </p>
                                    {order.tableNumber && (
                                        <Badge
                                            variant="secondary"
                                            className="h-5 gap-1 rounded-sm px-1.5 text-xs font-semibold uppercase tracking-tight">
                                            <LayoutGrid className="h-3 w-3" />
                                            Meja {order.tableNumber}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {order.itemsSummary}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-primary tabular-nums">
                                    Rp {fmt.format(order.totalAmount)}
                                </p>
                                <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {waitLabel}
                                </p>
                            </div>
                        </div>

                        {/* Bottom row: cashier + action */}
                        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span className="font-medium">{order.cashier}</span>
                            </div>
                            <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold"
                                onClick={() => onSelect(order)}>
                                Lanjutkan Bayar
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}