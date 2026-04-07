"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderCard } from "./OrderCard";
import type { OrderV2Entry, GoodsOrderStatus } from "@/lib/apis/orders-v2";

interface OrdersKanbanColumnProps {
    title: string;
    icon: React.ReactNode;
    entries: OrderV2Entry[];
    count: number;
    accentColor: string;
    onPrimaryAction: (entry: OrderV2Entry, nextStatus: GoodsOrderStatus) => void;
    onCancel: (entry: OrderV2Entry) => void;
    onDetail: (entry: OrderV2Entry) => void;
    onPrint: (entry: OrderV2Entry) => void;
    onPrintTickets: (entry: OrderV2Entry) => void;
    onViewProof: (entry: OrderV2Entry) => void;
    pendingId: string | null;
    printingId: string | null;
    printingType: "receipt" | "ticket" | null;
}

export function OrdersKanbanColumn({
    title,
    icon,
    entries,
    count,
    accentColor,
    onPrimaryAction,
    onCancel,
    onDetail,
    onPrint,
    onPrintTickets,
    onViewProof,
    pendingId,
    printingId,
    printingType,
}: OrdersKanbanColumnProps) {
    return (
        <div className="flex flex-col min-w-[280px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                </div>
                <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${accentColor}`}
                >
                    {count}
                </span>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
                <div className="p-2 space-y-2">
                    {entries.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-xs text-slate-400 dark:text-slate-500">
                            Tidak ada pesanan
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <OrderCard
                                key={entry.id}
                                entry={entry}
                                onPrimaryAction={onPrimaryAction}
                                onCancel={onCancel}
                                onDetail={onDetail}
                                onPrint={onPrint}
                                onPrintTickets={onPrintTickets}
                                onViewProof={onViewProof}
                                isPending={pendingId === entry.id}
                                isPrinting={printingId === entry.id}
                                printingType={printingType}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
