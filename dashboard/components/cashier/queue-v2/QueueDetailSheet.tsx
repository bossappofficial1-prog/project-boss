"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Phone, Timer, Calendar, ChevronRight, X, MapPin, CalendarClock, ImageIcon, CreditCard, ShoppingBag, Package, CalendarRange } from "lucide-react";
import type { QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";

interface QueueDetailSheetProps {
    entry: QueueV2Entry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPrimaryAction: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
    onCancel: (entry: QueueV2Entry) => void;
    onViewProof: (entry: QueueV2Entry) => void;
    onReschedule?: (entry: QueueV2Entry) => void;
    isPending: boolean;
}

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }
> = {
    AWAITING_PAYMENT: { label: "Menunggu Bayar", variant: "warning" },
    CONFIRMED: { label: "Dikonfirmasi", variant: "secondary" },
    PROCESSING: { label: "Diproses", variant: "secondary" },
    READY: { label: "Siap Dilayani", variant: "success" },
    ON_GOING: { label: "Sedang Dilayani", variant: "default" },
    COMPLETED: { label: "Selesai", variant: "success" },
    CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

const PRIMARY_ACTIONS: Partial<
    Record<QueueOrderStatus, { nextStatus: QueueOrderStatus; label: string }>
> = {
    AWAITING_PAYMENT: { nextStatus: "PROCESSING", label: "Proses Pesanan" },
    PROCESSING: { nextStatus: "CONFIRMED", label: "Konfirmasi Antrian" },
    CONFIRMED: { nextStatus: "READY", label: "Tandai Siap" },
    READY: { nextStatus: "ON_GOING", label: "Mulai Layanan" },
    ON_GOING: { nextStatus: "COMPLETED", label: "Selesaikan Layanan" },
};

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

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

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

const PAYMENT_LABELS: Record<string, string> = {
    manual_transfer: "Transfer Manual",
    manual: "Manual",
    cash: "Cash",
    qris: "QRIS",
    qris_dynamic: "QRIS Dynamic",
};

function getPaymentLabel(method: string | null): string {
    if (!method) return "Online";
    return PAYMENT_LABELS[method.toLowerCase()] ?? method;
}

const NEEDS_TODAY: QueueOrderStatus[] = ["READY", "ON_GOING", "COMPLETED"];

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </div>
    );
}

export function QueueDetailSheet({
    entry,
    open,
    onOpenChange,
    onPrimaryAction,
    onCancel,
    onViewProof,
    onReschedule,
    isPending,
}: QueueDetailSheetProps) {
    if (!entry) return null;

    const statusConfig = STATUS_CONFIG[entry.orderStatus] ?? STATUS_CONFIG.PROCESSING;
    const primary = PRIMARY_ACTIONS[entry.orderStatus];
    const isTerminal = entry.orderStatus === "COMPLETED" || entry.orderStatus === "CANCELLED";
    const isFuture = isFutureDate(entry.scheduledStart);
    const blockAction = isFuture && primary && NEEDS_TODAY.includes(primary.nextStatus);
    const isAwaitingManualProof =
        entry.orderStatus === "AWAITING_PAYMENT" && entry.isManualPayment && !entry.paymentProofUrl;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg">Detail Antrian #{entry.position}</SheetTitle>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                </SheetHeader>

                <div className="mt-6 p-6 space-y-6">
                    {/* Customer info */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pelanggan</h4>
                        <div className="space-y-2">
                            <InfoRow icon={User} label="Nama" value={entry.customerName} />
                            {entry.customerPhone && (
                                <InfoRow icon={Phone} label="Telepon" value={entry.customerPhone} />
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* Service info */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Layanan</h4>
                        <div className="space-y-2">
                            {entry.items.filter((i) => i.productType === "SERVICE").length > 0 ? (
                                entry.items
                                    .filter((i) => i.productType === "SERVICE")
                                    .map((item) => (
                                        <div key={item.id} className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    {item.productName}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                    {item.duration && (
                                                        <span className="flex items-center gap-1">
                                                            <Timer className="w-3 h-3" />
                                                            {item.duration} menit
                                                        </span>
                                                    )}
                                                    <span>{formatCurrency(item.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <InfoRow icon={MapPin} label="Layanan" value={entry.productName} />
                            )}
                            {entry.staffName && (
                                <InfoRow icon={User} label="Staff" value={entry.staffName} />
                            )}
                        </div>
                    </section>

                    {/* Goods items */}
                    {entry.items.filter((i) => i.productType === "GOODS").length > 0 && (
                        <>
                            <Separator />
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Produk Tambahan
                                </h4>
                                <div className="space-y-2">
                                    {entry.items
                                        .filter((i) => i.productType === "GOODS")
                                        .map((item) => (
                                            <div key={item.id} className="flex items-start gap-3">
                                                <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {item.quantity}x {formatCurrency(item.price)}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        </>
                    )}

                    <Separator />

                    {/* Schedule */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jadwal</h4>
                        <div className="space-y-2">
                            <InfoRow icon={Calendar} label="Dibuat" value={formatDateTime(entry.createdAt)} />
                            {entry.scheduledStart && (
                                <InfoRow
                                    icon={Clock}
                                    label="Jadwal"
                                    value={`${formatTime(entry.scheduledStart)} - ${formatTime(entry.scheduledEnd)}`}
                                />
                            )}
                            {isFuture && entry.scheduledStart && (
                                <InfoRow
                                    icon={CalendarClock}
                                    label="Tanggal Layanan"
                                    value={formatDate(entry.scheduledStart)}
                                />
                            )}
                        </div>
                        {isFuture && (
                            <div className="rounded-md bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-3 py-2">
                                <p className="text-xs text-orange-700 dark:text-orange-300">
                                    Booking untuk tanggal mendatang — tidak bisa dilayani sebelum tanggal jadwal.
                                </p>
                            </div>
                        )}
                    </section>

                    <Separator />

                    {/* Payment */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pembayaran</h4>
                        <div className="space-y-2">
                            <InfoRow icon={CreditCard} label="Metode" value={getPaymentLabel(entry.paymentMethod)} />
                        </div>
                        <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(entry.totalAmount)}
                            </p>
                        </div>
                        {entry.isManualPayment && entry.paymentProofUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => onViewProof(entry)}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Lihat Bukti Pembayaran
                            </Button>
                        )}
                        {isAwaitingManualProof && (
                            <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2">
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Menunggu customer mengirim bukti pembayaran. Konfirmasi belum dapat dilakukan.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Cancellation reason */}
                    {entry.cancellationReason && (
                        <>
                            <Separator />
                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                                    Alasan Pembatalan
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-red-50 dark:bg-red-950 rounded-md p-3">
                                    {entry.cancellationReason}
                                </p>
                            </section>
                        </>
                    )}

                    {/* Actions */}
                    {!isTerminal && (
                        <div className="space-y-3 pt-3">
                            {isAwaitingManualProof && (
                                <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2 text-center">
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Bukti pembayaran belum dikirim — konfirmasi dinonaktifkan
                                    </p>
                                </div>
                            )}
                            {blockAction && !isAwaitingManualProof && (
                                <div className="rounded-md bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-3 py-2 text-center">
                                    <p className="text-xs text-orange-700 dark:text-orange-300">
                                        Belum bisa dilayani — jadwal belum tiba
                                    </p>
                                </div>
                            )}
                            {entry.scheduledStart && onReschedule && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={isPending}
                                    onClick={() => onReschedule(entry)}
                                >
                                    <CalendarRange className="w-4 h-4 mr-2" />
                                    Reschedule Jadwal
                                </Button>
                            )}
                            <div className="flex gap-3">
                                {primary && !blockAction && !isAwaitingManualProof && (
                                    <Button
                                        className="flex-1"
                                        disabled={isPending}
                                        onClick={() => onPrimaryAction(entry, primary.nextStatus)}
                                    >
                                        {primary.label}
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    disabled={isPending}
                                    onClick={() => onCancel(entry)}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Batalkan
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
