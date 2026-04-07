"use client";

import { Clock, ChevronRight, X, Printer, ShoppingBag, CreditCard, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderV2Entry, GoodsOrderStatus } from "@/lib/apis/orders-v2";
import { formatCurrency } from "@/components/owner/orders/utils";

interface OrderCardProps {
    entry: OrderV2Entry;
    onPrimaryAction?: (entry: OrderV2Entry, nextStatus: GoodsOrderStatus) => void;
    onCancel?: (entry: OrderV2Entry) => void;
    onDetail?: (entry: OrderV2Entry) => void;
    onPrint?: (entry: OrderV2Entry) => void;
    onPrintTickets?: (entry: OrderV2Entry) => void;
    onViewProof?: (entry: OrderV2Entry) => void;
    isPending?: boolean;
    isPrinting?: boolean;
    printingType?: "receipt" | "ticket" | null;
}

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; borderColor: string }
> = {
    AWAITING_PAYMENT: {
        label: "Menunggu Bayar",
        color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        borderColor: "border-l-amber-500",
    },
    PROCESSING: {
        label: "Diproses",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        borderColor: "border-l-blue-500",
    },
    CONFIRMED: {
        label: "Dikonfirmasi",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        borderColor: "border-l-blue-500",
    },
    READY: {
        label: "Siap Diambil",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        borderColor: "border-l-emerald-500",
    },
    COMPLETED: {
        label: "Selesai",
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        borderColor: "border-l-green-500",
    },
    CANCELLED: {
        label: "Dibatalkan",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        borderColor: "border-l-red-500",
    },
};

const PRIMARY_ACTIONS: Partial<
    Record<GoodsOrderStatus, { nextStatus: GoodsOrderStatus; label: string }>
> = {
    AWAITING_PAYMENT: { nextStatus: "PROCESSING", label: "Konfirmasi" },
    PROCESSING: { nextStatus: "READY", label: "Siap Diambil" },
    CONFIRMED: { nextStatus: "READY", label: "Siap Diambil" },
    READY: { nextStatus: "COMPLETED", label: "Selesai" },
};

const PAYMENT_LABELS: Record<string, string> = {
    manual_transfer: "Transfer",
    manual: "Manual",
    cash: "Cash",
    qris: "QRIS",
    qris_dynamic: "QRIS",
    online: "Online",
    midtrans: "Midtrans",
};

function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getPaymentLabel(method: string | null): string {
    if (!method) return "Online";
    const normalized = method.toLowerCase();
    return PAYMENT_LABELS[normalized] ?? method.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrderCard({ entry, onPrimaryAction, onCancel, onDetail, onPrint, onPrintTickets, onViewProof, isPending, isPrinting, printingType }: OrderCardProps) {
    const config = STATUS_CONFIG[entry.orderStatus] ?? STATUS_CONFIG.PROCESSING;
    const primary = PRIMARY_ACTIONS[entry.orderStatus];
    const isTerminal = entry.orderStatus === "COMPLETED" || entry.orderStatus === "CANCELLED";
    const itemCount = entry.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div
            className={`group relative rounded-md border-l-4 ${config.borderColor} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => onDetail?.(entry)}
        >
            <div className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                        {entry.customerName}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${config.color} border-0`}>
                        {config.label}
                    </Badge>
                </div>

                {/* Items summary */}
                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <ShoppingBag className="w-3 h-3 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        {entry.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="truncate">
                                {item.quantity}x {item.productName}
                            </p>
                        ))}
                        {entry.items.length > 2 && (
                            <p className="text-slate-400">+{entry.items.length - 2} item lainnya</p>
                        )}
                    </div>
                </div>

                {/* Info row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {getPaymentLabel(entry.paymentMethod)}
                    </span>
                    {entry.isManualPayment && entry.paymentProofUrl && (
                        <button
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewProof?.(entry);
                            }}
                        >
                            <ImageIcon className="w-3 h-3" />
                            Bukti
                        </button>
                    )}
                </div>

                {/* Amount + item count */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(entry.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {itemCount} item
                    </span>
                </div>

                {/* Actions */}
                {!isTerminal && (
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {primary && entry.isManualPayment && entry.paymentProofUrl && (
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                disabled={isPending}
                                onClick={() => onPrimaryAction?.(entry, entry.items.some((itm) => itm.productType === 'TICKET') ? 'COMPLETED' : primary.nextStatus)}
                            >
                                {primary.label}
                                <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                            disabled={isPending || isPrinting}
                            onClick={() => onPrint?.(entry)}
                            title="Cetak struk"
                        >
                            <Printer className={`w-3.5 h-3.5 ${isPrinting && printingType === "receipt" ? "animate-pulse" : ""}`} />
                        </Button>
                        {entry.items.some(item => item.productType === "TICKET") && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                disabled={isPending || isPrinting}
                                onClick={() => onPrintTickets?.(entry)}
                                title="Cetak tiket"
                            >
                                <Printer className={`w-3.5 h-3.5 ${isPrinting && printingType === "ticket" ? "animate-pulse" : ""}`} />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={isPending}
                            onClick={() => onCancel?.(entry)}
                            title="Batalkan"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                {/* Completed: print only */}
                {entry.orderStatus === "COMPLETED" && (
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={isPrinting}
                            onClick={() => onPrint?.(entry)}
                        >
                            <Printer className={`w-3 h-3 mr-1 ${isPrinting && printingType === "receipt" ? "animate-pulse" : ""}`} />
                            {isPrinting && printingType === "receipt" ? "Sedang Memproses..." : "Cetak Struk"}
                        </Button>
                        {entry.items.some(item => item.productType === "TICKET") && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400"
                                disabled={isPrinting}
                                onClick={() => onPrintTickets?.(entry)}
                            >
                                <Printer className={`w-3 h-3 mr-1 ${isPrinting && printingType === "ticket" ? "animate-pulse" : ""}`} />
                                {isPrinting && printingType === "ticket" ? "Sedang Memproses..." : "Cetak Tiket"}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
