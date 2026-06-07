"use client";

import React from "react";
import { Check, Receipt, BarChart } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessDialogProps {
    open: boolean;
    onClose: () => void;
    type: "PURCHASE" | "RETURN";
    itemCount: number;
    totalAmount?: number;
}

const currencyFmt = new Intl.NumberFormat("id-ID");

export function SuccessDialog({
    open,
    onClose,
    type,
    itemCount,
    totalAmount,
}: SuccessDialogProps) {
    const isPurchase = type === "PURCHASE";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm p-6 rounded-lg border border-border bg-card shadow-lg text-center animate-scaleIn duration-150">
                <DialogHeader className="items-center flex flex-col gap-2">
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full border shadow-sm",
                        isPurchase 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                    )}>
                        <Check className="h-6 w-6 stroke-[2.5]" />
                    </div>

                    <div className="space-y-1">
                        <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                            {isPurchase ? "Stok Berhasil Ditambahkan" : "Retur Barang Berhasil"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Pencatatan Sukses
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* Transaction Summary Box */}
                <div className="my-4 p-4 rounded-md border bg-muted/10 space-y-3 text-left text-sm">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart className="h-4 w-4 text-muted-foreground/60" />
                            Tipe Transaksi
                        </span>
                        <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border",
                            isPurchase 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                        )}>
                            {isPurchase ? "Pembelian" : "Retur"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Receipt className="h-4 w-4 text-muted-foreground/60" />
                            Jumlah Item
                        </span>
                        <span className="font-bold text-foreground">
                            {itemCount} Produk
                        </span>
                    </div>

                    {isPurchase && totalAmount ? (
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Total Estimasi
                            </span>
                            <span className="text-sm font-bold text-foreground tabular-nums">
                                Rp {currencyFmt.format(totalAmount)}
                            </span>
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button 
                        onClick={onClose} 
                        className={cn(
                            "w-full text-xs font-bold h-9 rounded-md text-white transition-all shadow-sm",
                            isPurchase 
                                ? "bg-primary text-primary-foreground hover:bg-primary/95" 
                                : "bg-orange-600 hover:bg-orange-500 text-white"
                        )}
                    >
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
