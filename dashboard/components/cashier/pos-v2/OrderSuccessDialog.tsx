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

interface OrderSuccessDialogProps {
    open: boolean;
    result: PosV2OrderResult | null;
    onClose: () => void;
}

const fmt = new Intl.NumberFormat("id-ID");

export function OrderSuccessDialog({ open, result, onClose }: OrderSuccessDialogProps) {
    const [isPrinting, setIsPrinting] = React.useState(false);

    const handlePrintReceipt = async () => {
        if (!result) return;

        setIsPrinting(true);
        try {
            const blob = await posV2Api.getReceipt(result.orderId);
            const url = URL.createObjectURL(blob);

            const printWindow = window.open(url, "_blank", "width=400,height=600");
            if (printWindow) {
                printWindow.addEventListener("load", () => {
                    printWindow.print();
                });
            } else {
                // Fallback: download the PDF
                const a = document.createElement("a");
                a.href = url;
                a.download = `receipt-${result.orderId}.pdf`;
                a.click();
                toast.info("PDF struk sudah diunduh");
            }

            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            console.error("Print receipt error:", error);
            toast.error("Gagal mencetak struk");
        } finally {
            setIsPrinting(false);
        }
    };

    const handleCloseAndReset = () => {
        onClose();
    };

    if (!result) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleCloseAndReset()}>
            <DialogContent className="max-w-sm">
                <DialogHeader className="items-center text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <DialogTitle className="text-lg">Pesanan Berhasil!</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Order ID</span>
                                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                                    {result.orderId}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Pelanggan</span>
                                <span className="text-slate-900 dark:text-slate-100">{result.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Jumlah Item</span>
                                <span className="text-slate-900 dark:text-slate-100">{result.itemCount}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                                <span className="text-slate-700 dark:text-slate-300">Total</span>
                                <span className="text-slate-900 dark:text-slate-100">
                                    Rp {fmt.format(result.totalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Dibayar</span>
                                <span className="text-slate-900 dark:text-slate-100">
                                    Rp {fmt.format(result.cashReceived)}
                                </span>
                            </div>
                            {result.change > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Kembalian</span>
                                    <span className="font-semibold">Rp {fmt.format(result.change)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCloseAndReset}
                            className="gap-2">
                            <X className="h-4 w-4" />
                            Tutup
                        </Button>
                        <Button
                            onClick={handlePrintReceipt}
                            disabled={isPrinting}
                            className="gap-2 bg-blue-600 hover:bg-blue-500">
                            <Printer className="h-4 w-4" />
                            {isPrinting ? "Mencetak..." : "Cetak Struk"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
