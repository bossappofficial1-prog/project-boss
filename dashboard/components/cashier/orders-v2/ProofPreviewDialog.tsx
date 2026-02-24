"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { OrderV2Entry } from "@/lib/apis/orders-v2";

interface ProofPreviewDialogProps {
    entry: OrderV2Entry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDateTime(dateStr: string): string {
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
};

function getPaymentLabel(method: string | null): string {
    if (!method) return "Online";
    return PAYMENT_LABELS[method.toLowerCase()] ?? method;
}

export function ProofPreviewDialog({ entry, open, onOpenChange }: ProofPreviewDialogProps) {
    const proofUrl = entry?.paymentProofUrl ?? null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Bukti Pembayaran</DialogTitle>
                    {entry && (
                        <DialogDescription>
                            Pesanan #{entry.id.slice(-8)} atas nama {entry.customerName}.
                        </DialogDescription>
                    )}
                </DialogHeader>

                {!entry && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Tidak ada bukti pembayaran yang dipilih.
                    </div>
                )}

                {entry && !proofUrl && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Bukti pembayaran tidak tersedia untuk pesanan ini.
                    </div>
                )}

                {entry && proofUrl && (
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div>
                                    <p className="text-muted-foreground">Total Pembayaran</p>
                                    <p className="font-semibold">{formatCurrency(entry.totalAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Metode</p>
                                    <p className="font-semibold">{getPaymentLabel(entry.paymentMethod)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Waktu Pesan</p>
                                    <p className="font-semibold">{formatDateTime(entry.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="w-full overflow-hidden rounded-lg border bg-background">
                                <img
                                    src={proofUrl}
                                    alt="Bukti pembayaran"
                                    className="w-full max-h-[480px] object-contain"
                                />
                            </div>
                            <Button type="button" variant="outline" asChild>
                                <a href={proofUrl} target="_blank" rel="noreferrer">
                                    Buka di tab baru
                                </a>
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
