"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GoodsOrder } from '@/lib/apis/order';
import {
    detectProofUrl,
    formatCurrency,
    formatDateTime,
    formatPaymentMethodLabel,
} from './utils';

interface ProofPreviewDialogProps {
    order: GoodsOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProofPreviewDialog({ order, open, onOpenChange }: ProofPreviewDialogProps) {
    const proofUrl = order ? detectProofUrl(order) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Bukti Pembayaran</DialogTitle>
                    {order && (
                        <DialogDescription>
                            Pesanan #{order.id.slice(-8)} atas nama {order.guestCustomer?.name ?? '-'}.
                        </DialogDescription>
                    )}
                </DialogHeader>

                {!order && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Tidak ada bukti pembayaran yang dipilih.
                    </div>
                )}

                {order && !proofUrl && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Bukti pembayaran tidak tersedia untuk pesanan ini.
                    </div>
                )}

                {order && proofUrl && (
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div>
                                    <p className="text-muted-foreground">Total Pembayaran</p>
                                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Metode</p>
                                    <p className="font-semibold">{formatPaymentMethodLabel(order)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Waktu Pesan</p>
                                    <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
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
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                            >
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
