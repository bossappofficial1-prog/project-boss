"use client";

import { Clock, User, Timer, ChevronRight, X, CalendarClock, ImageIcon, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";

interface QueueCardProps {
    entry: QueueV2Entry;
    onPrimaryAction?: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
    onCancel?: (entry: QueueV2Entry) => void;
    onDetail?: (entry: QueueV2Entry) => void;
    onViewProof?: (entry: QueueV2Entry) => void;
    isPending?: boolean;
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
    CONFIRMED: {
        label: "Dikonfirmasi",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        borderColor: "border-l-blue-500",
    },
    PROCESSING: {
        label: "Diproses",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        borderColor: "border-l-blue-500",
    },
    READY: {
        label: "Siap Dilayani",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        borderColor: "border-l-emerald-500",
    },
    ON_GOING: {
        label: "Sedang Dilayani",
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        borderColor: "border-l-purple-500",
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
    Record<QueueOrderStatus, { nextStatus: QueueOrderStatus; label: string; variant: "default" | "secondary" }>
> = {
    AWAITING_PAYMENT: { nextStatus: "PROCESSING", label: "Konfirmasi", variant: "default" },
    CONFIRMED: { nextStatus: "PROCESSING", label: "Proses", variant: "default" },
    PROCESSING: { nextStatus: "READY", label: "Siapkan", variant: "default" },
    READY: { nextStatus: "ON_GOING", label: "Mulai Layanan", variant: "default" },
    ON_GOING: { nextStatus: "COMPLETED", label: "Selesaikan", variant: "default" },
};

function formatTime(dateStr: string | null): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function isFutureDate(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    return target.getTime() > today.getTime();
}

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

// Transitions beyond PROCESSING require today's date
const NEEDS_TODAY_STATUSES: QueueOrderStatus[] = ["READY", "ON_GOING", "COMPLETED"];

export function QueueCard({ entry, onPrimaryAction, onCancel, onDetail, onViewProof, isPending }: QueueCardProps) {
    const config = STATUS_CONFIG[entry.orderStatus] ?? STATUS_CONFIG.PROCESSING;
    const primary = PRIMARY_ACTIONS[entry.orderStatus];
    const isTerminal = entry.orderStatus === "COMPLETED" || entry.orderStatus === "CANCELLED";
    const isFuture = isFutureDate(entry.scheduledStart);
    const blockAction = isFuture && primary && NEEDS_TODAY_STATUSES.includes(primary.nextStatus);

    // Block confirm for manual payments without proof
    const isAwaitingManualProof =
        entry.orderStatus === "AWAITING_PAYMENT" && entry.isManualPayment && !entry.paymentProofUrl;

    return (
        <div
            className={`group relative rounded-md border-l-4 ${config.borderColor} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => onDetail?.(entry)}
        >
            <div className="p-3 space-y-2">
                {/* Header: position + status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                            {entry.position}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                            {entry.customerName}
                        </span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${config.color} border-0`}>
                        {config.label}
                    </Badge>
                </div>

                {/* Service name + goods badge */}
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                        {entry.productName}
                    </p>
                    {entry.goodsCount > 0 && (
                        <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            +{entry.goodsCount} produk
                        </Badge>
                    )}
                </div>

                {/* Future booking badge */}
                {isFuture && entry.scheduledStart && (
                    <div className="flex items-center gap-1 rounded bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-2 py-0.5">
                        <CalendarClock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                        <span className="text-[10px] font-medium text-orange-700 dark:text-orange-300">
                            Dijadwalkan {formatShortDate(entry.scheduledStart)}
                        </span>
                    </div>
                )}

                {/* Info row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {entry.scheduledStart && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.scheduledStart)}
                            {entry.scheduledEnd && ` - ${formatTime(entry.scheduledEnd)}`}
                        </span>
                    )}
                    {entry.productDuration && (
                        <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {entry.productDuration} mnt
                        </span>
                    )}
                    {entry.staffName && (
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {entry.staffName}
                        </span>
                    )}
                </div>

                {/* Amount */}
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(entry.totalAmount)}
                </div>

                {/* Actions */}
                {!isTerminal && (
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {/* View proof button */}
                        {entry.isManualPayment && entry.paymentProofUrl && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => onViewProof?.(entry)}
                            >
                                <ImageIcon className="w-3 h-3 mr-1" />
                                Bukti
                            </Button>
                        )}
                        {primary && !blockAction && !isAwaitingManualProof && (
                            <Button
                                size="sm"
                                variant={primary.variant}
                                className="flex-1 h-8 text-xs"
                                disabled={isPending}
                                onClick={() => onPrimaryAction?.(entry, primary.nextStatus)}
                            >
                                {primary.label}
                                <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        )}
                        {isAwaitingManualProof && (
                            <span className="flex-1 text-[10px] text-amber-600 dark:text-amber-400 text-center">
                                Menunggu bukti pembayaran
                            </span>
                        )}
                        {blockAction && !isAwaitingManualProof && (
                            <span className="flex-1 text-[10px] text-orange-600 dark:text-orange-400 text-center">
                                Belum bisa dilayani (jadwal belum tiba)
                            </span>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={isPending}
                            onClick={() => onCancel?.(entry)}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
