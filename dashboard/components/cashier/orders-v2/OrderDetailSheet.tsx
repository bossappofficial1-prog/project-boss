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
import {
    Clock, User, Phone, CreditCard, Calendar, ChevronRight, X,
    Printer, ImageIcon, ShoppingBag,
} from "lucide-react";
import type { OrderV2Entry, GoodsOrderStatus } from "@/lib/apis/orders-v2";
import { formatCurrency } from "@/lib/utils";

interface OrderDetailSheetProps {
    entry: OrderV2Entry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPrimaryAction: (entry: OrderV2Entry, nextStatus: GoodsOrderStatus) => void;
    onCancel: (entry: OrderV2Entry) => void;
    onPrint: (entry: OrderV2Entry) => void;
    onPrintTickets: (entry: OrderV2Entry) => void;
    onViewProof: (entry: OrderV2Entry) => void;
    isPending: boolean;
    printingId: string | null;
    printingType: "receipt" | "ticket" | null;
}

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }
> = {
    AWAITING_PAYMENT: { label: "Menunggu Bayar", variant: "warning" },
    PROCESSING: { label: "Diproses", variant: "secondary" },
    CONFIRMED: { label: "Dikonfirmasi", variant: "secondary" },
    READY: { label: "Siap Diambil", variant: "success" },
    COMPLETED: { label: "Selesai", variant: "success" },
    CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

const PRIMARY_ACTIONS: Partial<
    Record<GoodsOrderStatus, { nextStatus: GoodsOrderStatus; label: string }>
> = {
    AWAITING_PAYMENT: { nextStatus: "PROCESSING", label: "Konfirmasi Pembayaran" },
    PROCESSING: { nextStatus: "READY", label: "Tandai Siap Diambil" },
    CONFIRMED: { nextStatus: "READY", label: "Tandai Siap Diambil" },
    READY: { nextStatus: "COMPLETED", label: "Selesaikan Pesanan" },
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

const PAYMENT_LABELS: Record<string, string> = {
    manual_transfer: "Transfer Manual",
    manual: "Manual",
    cash: "Cash",
    qris: "QRIS",
    qris_dynamic: "QRIS Dynamic",
    online: "Online",
    midtrans: "Midtrans",
};

function getPaymentLabel(method: string | null): string {
    if (!method) return "Online";
    return PAYMENT_LABELS[method.toLowerCase()] ?? method.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

export function OrderDetailSheet({
    entry,
    open,
    onOpenChange,
    onPrimaryAction,
    onCancel,
    onPrint,
    onPrintTickets,
    onViewProof,
    isPending,
    printingId,
    printingType,
}: OrderDetailSheetProps) {
    if (!entry) return null;

    const statusConfig = STATUS_CONFIG[entry.orderStatus] ?? STATUS_CONFIG.PROCESSING;
    const primary = PRIMARY_ACTIONS[entry.orderStatus];
    const isTerminal = entry.orderStatus === "COMPLETED" || entry.orderStatus === "CANCELLED";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg">
                            Pesanan #{entry.id.slice(-8)}
                        </SheetTitle>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                </SheetHeader>

                <div className="mt-6 p-6 space-y-6">
                    {/* Customer info */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Pelanggan</h4>
                        <div className="space-y-2">
                            <InfoRow icon={User} label="Nama" value={entry.customerName} />
                            {entry.customerPhone && (
                                <InfoRow icon={Phone} label="Telepon" value={entry.customerPhone} />
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* Items */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">
                            Item Pesanan ({entry.items.length})
                        </h4>
                        <div className="space-y-2">
                            {entry.items.map((item, i) => (
                                <div
                                    key={i}
                                    className="rounded-md border border-border px-3 py-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {item.productName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{item.quantity}x @ {formatCurrency(item.price)}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground whitespace-nowrap ml-3">
                                            {formatCurrency(item.quantity * item.price)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator />

                    {/* Payment */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Pembayaran</h4>
                        <div className="space-y-2">
                            <InfoRow icon={CreditCard} label="Metode" value={getPaymentLabel(entry.paymentMethod)} />
                            <InfoRow icon={Calendar} label="Waktu Pesan" value={formatDateTime(entry.createdAt)} />
                        </div>
                        <div className="rounded-md border border-border p-3">
                            <p className="text-xl font-bold text-foreground">
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
                    </section>

                    {/* Cancellation reason */}
                    {entry.cancellationReason && (
                        <>
                            <Separator />
                            <section className="space-y-2">
                                <h4 className="text-sm font-semibold text-destructive">
                                    Alasan Pembatalan
                                </h4>
                                <p className="text-sm text-foreground bg-destructive/10 rounded-md p-3">
                                    {entry.cancellationReason}
                                </p>
                            </section>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-3">
                        {!isTerminal && (
                            <div className="flex gap-3">
                                {primary && (
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
                                    Batal
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
