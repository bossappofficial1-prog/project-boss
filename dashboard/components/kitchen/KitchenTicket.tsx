"use client";

import { useEffect, useState } from "react";
import { Clock, Hash, AlertCircle, Play, Check, CheckCheck, Loader2, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderV2Entry, GoodsOrderStatus } from "@/lib/apis/orders-v2";
import { useOrdersV2UpdateStatus } from "@/hooks/api/use-orders-v2";

interface KitchenTicketProps {
    entry: OrderV2Entry;
}

export function KitchenTicket({ entry }: KitchenTicketProps) {
    const [elapsed, setElapsed] = useState(0);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const start = new Date(entry.createdAt).getTime();
        const update = () => {
            setNow(Date.now());
            setElapsed(Math.floor((Date.now() - start) / 1000 / 60));
        };
        update();
        const interval = setInterval(update, 10000);
        return () => clearInterval(interval);
    }, [entry.createdAt]);

    const isOverdue = elapsed >= 15;
    const isAlready = entry.orderStatus === "READY"
    const isWarning = elapsed >= 10 && elapsed < 15;

    const isNewItem = (itemCreatedAt: string) => {
        // Highlight items added in the last 5 minutes
        return (now - new Date(itemCreatedAt).getTime()) < 300000;
    };

    const hasNewItems = entry.items.some(item => isNewItem(item.createdAt));
    const isAddition = hasNewItems && (entry.orderStatus !== "AWAITING_PAYMENT" && entry.orderStatus !== "CONFIRMED");

    return (
        <Card className={cn(
            "relative flex py-0 flex-col h-fit rounded-md border-t-4 shadow-sm overflow-hidden transition-all duration-300",
            isAddition ? "border-t-primary bg-primary/5 animate-in fade-in" :
                isWarning ? "border-t-chart-4 bg-chart-4/5" : "border-t-primary bg-background"
        )}>
            {isAddition && (
                <div className="bg-primary text-primary-foreground py-1 px-3 flex items-center justify-center gap-2 animate-pulse">
                    <UtensilsCrossed className="w-3 h-3" />
                    <span className="text-[9px] font-black">Pesanan Tambahan</span>
                </div>
            )}
            <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-foreground text-background w-8 h-8 rounded flex items-center justify-center">
                        <Hash className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground leading-none mb-1">Meja</p>
                        <h2 className="text-xl font-black tracking-tighter leading-none tabular-nums">{entry.tableNumber || "TA"}</h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground leading-none mb-1">Durasi</p>
                    <div className={cn(
                        "flex items-center justify-end gap-1 font-black tabular-nums tracking-tighter text-lg leading-none",
                        isOverdue ? "text-destructive" : isWarning ? "text-chart-4" : "text-primary"
                    )}>
                        <Clock className="w-3.5 h-3.5" />
                        {elapsed}m
                    </div>
                </div>
            </div>

            <div className="flex-1 p-3 space-y-3">
                <div className="space-y-2">
                    {entry.items.map((item, idx) => {
                        const isRecent = isNewItem(item.createdAt);
                        return (
                            <div
                                key={`${entry.id}-item-${idx}`}
                                className={cn(
                                    "flex items-start gap-3 p-1.5 rounded-sm transition-all duration-500",
                                    isRecent ? "bg-primary/10 ring-1 ring-primary/20 animate-in fade-in zoom-in" : ""
                                )}
                            >
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-sm font-black tabular-nums min-w-[32px] text-center border",
                                    isRecent ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border/40 text-foreground"
                                )}>
                                    {item.quantity}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground leading-tight uppercase tracking-tight">
                                            {item.productName}
                                        </p>
                                        {isRecent && (
                                            <span className="bg-primary text-primary-foreground text-[8px] font-black px-1 rounded-sm animate-pulse">BARU</span>
                                        )}
                                    </div>
                                    {item.productType === "SERVICE" && item.duration && (
                                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5">
                                            {item.duration}m
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {entry.staffName && (
                    <div className="mt-4 pt-3 border-t border-dashed border-border/60">
                        <p className="text-[10px] font-bold text-muted-foreground">Oleh: {entry.staffName}</p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground mb-0.5">Customer</p>
                    <p className="text-xs font-bold truncate tracking-tight text-foreground">{entry.customerName}</p>
                </div>
                <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-[9px] font-black px-2 py-0.5">
                    {entry.orderStatus}
                </Badge>
            </div>

            {isOverdue && !isAlready && (
                <div className="bg-destructive text-destructive-foreground py-1 px-3 flex items-center justify-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[9px] font-black">Priority Prep</span>
                </div>
            )}


            {hasNewItems && (
                <div className="absolute inset-0 pointer-events-none ring-1 ring-primary/20 ring-inset rounded-md" />
            )}
        </Card>
    );
}