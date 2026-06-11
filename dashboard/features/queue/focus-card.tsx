"use client";

import {
    Clock,
    User,
    Timer,
    ChevronRight,
    X,
    CalendarClock,
    ImageIcon,
    ShoppingBag,
    CheckCircle2,
    PlayCircle,
    UserCheck,
    MessageSquare,
    Phone,
    CreditCard,
    LayoutGrid
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";
import { cn, formatCurrency } from "@/lib/utils";

interface FocusCardProps {
    entry: QueueV2Entry;
    onPrimaryAction?: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
    onCancel?: (entry: QueueV2Entry) => void;
    onDetail?: (entry: QueueV2Entry) => void;
    onViewProof?: (entry: QueueV2Entry) => void;
    isPending?: boolean;
    isKitchenView?: boolean;
}

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; icon: any; borderColor: string; accentColor: string }
> = {
    AWAITING_PAYMENT: {
        label: "Menunggu Bayar",
        color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
        icon: Clock,
        borderColor: "border-amber-500/30",
        accentColor: "bg-amber-500",
    },
    CONFIRMED: {
        label: "Dikonfirmasi",
        color: "text-primary bg-primary/10",
        icon: UserCheck,
        borderColor: "border-primary/30",
        accentColor: "bg-primary",
    },
    PROCESSING: {
        label: "Diproses",
        color: "text-primary bg-primary/10",
        icon: Timer,
        borderColor: "border-primary/30",
        accentColor: "bg-primary",
    },
    ON_GOING: {
        label: "Sedang Dilayani",
        color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
        icon: PlayCircle,
        borderColor: "border-blue-500/30",
        accentColor: "bg-blue-500",
    },
    COMPLETED: {
        label: "Selesai",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
        icon: CheckCircle2,
        borderColor: "border-emerald-500/30",
        accentColor: "bg-emerald-500",
    },
    CANCELLED: {
        label: "Dibatalkan",
        color: "text-destructive bg-destructive/10",
        icon: X,
        borderColor: "border-destructive/30",
        accentColor: "bg-destructive",
    },
};

const PRIMARY_ACTIONS: Partial<
    Record<QueueOrderStatus, { nextStatus: QueueOrderStatus; label: string; variant: "default" | "secondary" | "success" | "blue" }>
> = {
    AWAITING_PAYMENT: { nextStatus: "CONFIRMED", label: "Konfirmasi Pembayaran", variant: "default" },
    PROCESSING: { nextStatus: "CONFIRMED", label: "Konfirmasi", variant: "default" },
    CONFIRMED: { nextStatus: "ON_GOING", label: "Mulai Layanan", variant: "default" },
    ON_GOING: { nextStatus: "COMPLETED", label: "Selesaikan Layanan", variant: "default" },
};

function formatTime(dateStr: string | null): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
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

export function FocusCard({
    entry,
    onPrimaryAction,
    onCancel,
    onDetail,
    onViewProof,
    isPending = false,
    isKitchenView = false
}: FocusCardProps) {
    const config = STATUS_CONFIG[entry.orderStatus] ?? STATUS_CONFIG.PROCESSING;
    const primary = PRIMARY_ACTIONS[entry.orderStatus];
    const isTerminal = entry.orderStatus === "COMPLETED" || entry.orderStatus === "CANCELLED";
    const isFuture = isFutureDate(entry.scheduledStart);
    const NEEDS_TODAY_STATUSES: QueueOrderStatus[] = ["ON_GOING", "COMPLETED"];
    const blockAction = isFuture && primary && NEEDS_TODAY_STATUSES.includes(primary.nextStatus);

    const isAwaitingManualProof =
        entry.orderStatus === "AWAITING_PAYMENT" && entry.isManualPayment && !entry.paymentProofUrl;

    const Icon = config.icon;

    return (
        <Card className={cn(
            "relative overflow-hidden gap-0 py-0 rounded-md border-border/80 bg-background shadow-sm transition-all border-l-4",
            config.borderColor
        )}>
            <div className="p-6 md:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="flex items-center justify-center w-16 h-16 rounded-md bg-muted/50 border border-border/40 text-3xl font-black text-foreground tabular-nums">
                            {entry.position}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                    {entry.customerName}
                                </h3>
                                <Badge variant="outline" className={cn("text-[9px] font-bold px-2 py-0.5 uppercase tracking-[0.15em] border-0", config.color)}>
                                    <Icon className="w-3 h-3 mr-1.5" />
                                    {config.label}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold opacity-40">ID:</span>
                                    <span className="text-xs font-bold tabular-nums">#{entry.id.slice(-8).toUpperCase()}</span>
                                </div>
                                {entry.tableNumber && (
                                    <>
                                        <div className="hidden sm:block h-3 w-px bg-border/40" />
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-xs font-black text-primary">Meja {entry.tableNumber}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            {!isKitchenView && (
                                <>
                                    <div className="hidden sm:block h-3 w-px bg-border/40" />
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 opacity-40" />
                                        <span className="text-xs font-bold tabular-nums">{entry.customerPhone || "08xx-xxxx-xxxx"}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {!isKitchenView && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-3 font-bold text-[10px]" onClick={() => onDetail?.(entry)}>
                            <MessageSquare className="w-3.5 h-3.5 mr-2" />
                            Detail
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md text-destructive hover:bg-destructive/10" disabled={isPending} onClick={() => onCancel?.(entry)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-md border border-border/40 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Informasi Layanan</p>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground leading-tight">{entry.productName}</p>
                        {entry.goodsCount > 0 && (
                            <p className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                                <ShoppingBag className="w-3 h-3" />
                                {entry.goodsCount} PRODUK TAMBAHAN
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-md border border-border/40 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Waktu & Durasi</p>
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground tabular-nums">
                                {entry.scheduledStart ? formatTime(entry.scheduledStart) : "Sekarang"}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {entry.productDuration || 0} Mnt
                            </p>
                        </div>
                        {isFuture && entry.scheduledStart && (
                            <div className="ml-auto px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-bold text-amber-600 flex items-center gap-1.5">
                                <CalendarClock className="w-3 h-3" />
                                {formatShortDate(entry.scheduledStart)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-md border border-border/40 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Staf Pelaksana</p>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{entry.staffName || "Belum Ditentukan"}</p>
                            <p className="text-[9px] font-bold text-muted-foreground/40">Teknisi</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            {!isKitchenView && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-0.5">Total Pembayaran</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-foreground tabular-nums">
                                {formatCurrency(entry.totalAmount)}
                            </p>
                            {entry.discountAmount > 0 && (
                                <span className="text-xs text-muted-foreground/50 line-through tabular-nums">
                                    {formatCurrency(entry.totalAmount + entry.discountAmount)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] font-bold h-5 bg-muted/30 border-border/40">
                                <CreditCard className="w-3 h-3 mr-1 opacity-40" />
                                {entry.paymentMethod || "Online"}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {!isTerminal && (
                            <>
                                {entry.isManualPayment && entry.paymentProofUrl && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-11 px-4 font-bold text-[10px]"
                                        onClick={() => onViewProof?.(entry)}
                                    >
                                        <ImageIcon className="w-4 h-4 mr-2 opacity-60" />
                                        Bukti
                                    </Button>
                                )}

                                {primary && !blockAction && !isAwaitingManualProof && (
                                    <Button
                                        size="lg"
                                        className="flex-1 sm:flex-none h-11 px-8 font-bold text-[10px] uppercase tracking-[0.2em] shadow-none"
                                        disabled={isPending}
                                        onClick={() => onPrimaryAction?.(entry, primary.nextStatus)}
                                    >
                                        {isPending ? (
                                            <Timer className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                {primary.label}
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                )}

                                {isAwaitingManualProof && (
                                    <div className="flex-1 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.15em] text-center">
                                            Menunggu Bukti Pembayaran
                                        </p>
                                    </div>
                                )}

                                {blockAction && !isAwaitingManualProof && (
                                    <div className="flex-1 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.15em] text-center">
                                            Belum Waktunya ({formatShortDate(entry.scheduledStart!)})
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
