"use client";

import React from "react";
import { CheckCircle, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2OrderResult } from "@/lib/apis/pos-v2";
import { usePrinterStore } from "@/stores/printer.store";
import { usePrint } from "@/hooks/use-print";

interface OrderSuccessDialogProps {
    open: boolean;
    result: PosV2OrderResult | null;
    printContext?: { items: any[], cashierName: string, outletName: string } | null;
    onClose: () => void;
}

const fmt = new Intl.NumberFormat("id-ID");

export function OrderSuccessDialog({ open, result, onClose }: OrderSuccessDialogProps) {
    const { handlePrintReceipt, handlePrintTickets, isPrinting } = usePrint()


    const handleCloseAndReset = () => {
        onClose();
    };

    if (!result) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleCloseAndReset()}>
            <DialogContent className="max-w-sm">
                <DialogHeader className="items-center text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <DialogTitle className="text-lg">Pesanan Berhasil!</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="rounded-md border border-border bg-muted/20 p-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Order ID</span>
                                <span className="font-mono font-medium text-foreground">
                                    {result.orderId}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pelanggan</span>
                                <span className="text-foreground">{result.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Jumlah Item</span>
                                <span className="text-foreground">{result.itemCount}</span>
                            </div>
                            <Separator />
                            {result.discountAmount ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="text-foreground">
                                            Rp {fmt.format(result.subtotal || result.totalAmount + result.discountAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-primary">
                                        <span>Potongan Poin</span>
                                        <span>
                                            -Rp {fmt.format(result.discountAmount)}
                                        </span>
                                    </div>
                                    <Separator />
                                </>
                            ) : null}
                            <div className="flex justify-between font-semibold">
                                <span className="text-foreground">Total</span>
                                <span className="text-foreground">
                                    Rp {fmt.format(result.totalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dibayar</span>
                                <span className="text-foreground">
                                    Rp {fmt.format(result.cashReceived)}
                                </span>
                            </div>
                            {result.change > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Kembalian</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {fmt.format(result.change)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {result.hasTickets ? (
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                onClick={() => handlePrintTickets(result.orderId)}
                                disabled={isPrinting}
                                className="gap-2 w-full">
                                <Printer className={`h-4 w-4 ${isPrinting ? "animate-pulse" : ""}`} />
                                {isPrinting ? "Mencetak..." : "Cetak Tiket"}
                            </Button>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCloseAndReset}
                            disabled={isPrinting}
                            className="gap-2">
                            <X className="h-4 w-4" />
                            Tutup
                        </Button>
                        <Button
                            onClick={() => handlePrintReceipt(result.orderId)}
                            disabled={isPrinting}
                            className="gap-2">
                            <Printer className={`h-4 w-4 ${isPrinting ? "animate-pulse" : ""}`} />
                            {isPrinting ? "Mencetak..." : "Cetak Struk"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
