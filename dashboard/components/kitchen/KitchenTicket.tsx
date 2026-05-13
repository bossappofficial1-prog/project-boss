"use client";

import { useEffect, useState } from "react";
import { Clock, Hash, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrderV2Entry } from "@/lib/apis/orders-v2";

interface KitchenTicketProps {
    entry: OrderV2Entry;
}

export function KitchenTicket({ entry }: KitchenTicketProps) {
    const [elapsed, setElapsed] = useState(0);
    const [now, setNow] = useState(Date.now());

    // Timer logic following UI guidelines (tabular-nums for metrics)
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

    // Urgent status based on B2B status colors
    const isOverdue = elapsed >= 15;
    const isWarning = elapsed >= 10 && elapsed < 15;

    // F&B Rule: Highlight items added in the last 60 seconds (Open Bill logic)
    const isNewItem = (itemCreatedAt: string) => {
        const itemTime = new Date(itemCreatedAt).getTime();
        return (now - itemTime) < 60000;
    };

    return (
        <Card className={cn(
            "relative flex flex-col h-full rounded-md border-t-4 shadow-sm overflow-hidden transition-all duration-300",
            isOverdue ? "border-t-red-500 bg-red-500/5 animate-pulse" :
            isWarning ? "border-t-amber-500 bg-amber-500/5" : "border-t-primary bg-background"
        )}>
            {/* Header: Table & Time following text-[10px] label guidelines */}
            <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-foreground text-background w-8 h-8 rounded flex items-center justify-center">
                        <Hash className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">Meja</p>
                        <h2 className="text-xl font-black tracking-tighter leading-none tabular-nums">{entry.tableNumber || "TA"}</h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">Durasi</p>
                    <div className={cn(
                        "flex items-center justify-end gap-1 font-black tabular-nums tracking-tighter text-lg leading-none",
                        isOverdue ? "text-red-600" : isWarning ? "text-amber-600" : "text-primary"
                    )}>
                        <Clock className="w-3.5 h-3.5" />
                        {elapsed}m
                    </div>
                </div>
            </div>

            {/* Body: Items List */}
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
                                    isRecent ? "bg-primary text-white border-primary" : "bg-muted border-border/40"
                                )}>
                                    {item.quantity}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground leading-tight uppercase tracking-tight">
                                            {item.productName}
                                        </p>
                                        {isRecent && (
                                            <span className="bg-primary text-white text-[8px] font-black px-1 rounded-sm animate-pulse">BARU</span>
                                        )}
                                    </div>
                                    {item.productType === "SERVICE" && item.duration && (
                                         <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                                            {item.duration}m
                                         </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Staff Info */}
                {entry.staffName && (
                    <div className="mt-4 pt-3 border-t border-dashed border-border/60">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Oleh: {entry.staffName}</p>
                    </div>
                )}
            </div>

            {/* Footer: Customer & Status using Semantic B2B badges */}
            <div className="p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Customer</p>
                    <p className="text-xs font-bold truncate tracking-tight">{entry.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">
                        {entry.orderStatus}
                    </Badge>
                </div>
            </div>

            {/* High Priority Alert Overlay */}
            {isOverdue && (
                <div className="bg-red-500 text-white py-1 px-3 flex items-center justify-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Priority Prep</span>
                </div>
            )}
        </Card>
    );
}
