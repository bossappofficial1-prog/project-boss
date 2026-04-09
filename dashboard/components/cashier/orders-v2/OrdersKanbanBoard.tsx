"use client";

import { Hourglass, Package, ShoppingBag, CheckCircle } from "lucide-react";
import { OrdersKanbanColumn } from "./OrdersKanbanColumn";
import type { OrdersV2Board, OrderV2Entry, GoodsOrderStatus } from "@/lib/apis/orders-v2";

interface OrdersKanbanBoardProps {
    board: OrdersV2Board;
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

const COLUMNS = [
    {
        key: "pending" as const,
        title: "Menunggu Bayar",
        icon: <Hourglass className="w-4 h-4 text-amber-500" />,
        accent: "bg-amber-500",
    },
    {
        key: "processing" as const,
        title: "Diproses",
        icon: <Package className="w-4 h-4 text-primary" />,
        accent: "bg-primary",
    },
    {
        key: "ready" as const,
        title: "Siap Diambil",
        icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
        accent: "bg-emerald-500",
    },
    {
        key: "completed" as const,
        title: "Selesai Hari Ini",
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        accent: "bg-emerald-500",
    },
];

export function OrdersKanbanBoard({
    board,
    onPrimaryAction,
    onCancel,
    onDetail,
    onPrint,
    onPrintTickets,
    onViewProof,
    pendingId,
    printingId,
    printingType,
}: OrdersKanbanBoardProps) {
    return (
        <>
            {/* Desktop */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-3">
                {COLUMNS.map((col) => (
                    <OrdersKanbanColumn
                        key={col.key}
                        title={col.title}
                        icon={col.icon}
                        entries={board[col.key]}
                        count={board[col.key].length}
                        accentColor={col.accent}
                        onPrimaryAction={onPrimaryAction}
                        onCancel={onCancel}
                        onDetail={onDetail}
                        onPrint={onPrint}
                        onPrintTickets={onPrintTickets}
                        onViewProof={onViewProof}
                        pendingId={pendingId}
                        printingId={printingId}
                        printingType={printingType}
                    />
                ))}
            </div>

            {/* Mobile */}
            <div className="lg:hidden space-y-3">
                {COLUMNS.map((col) => {
                    const entries = board[col.key];
                    if (col.key === "completed" && entries.length === 0) return null;

                    return (
                        <OrdersKanbanColumn
                            key={col.key}
                            title={col.title}
                            icon={col.icon}
                            entries={entries}
                            count={entries.length}
                            accentColor={col.accent}
                            onPrimaryAction={onPrimaryAction}
                            onCancel={onCancel}
                            onDetail={onDetail}
                            onPrint={onPrint}
                            onPrintTickets={onPrintTickets}
                            onViewProof={onViewProof}
                            pendingId={pendingId}
                            printingId={printingId}
                            printingType={printingType}
                        />
                    );
                })}
            </div>
        </>
    );
}
