"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
            <DialogContent className="sm:max-w-sm text-center">
                <DialogHeader className="items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <DialogTitle>
                        {isPurchase ? "Stok Berhasil Ditambahkan" : "Pengembalian Berhasil Dicatat"}
                    </DialogTitle>
                    <DialogDescription>
                        {itemCount} barang telah {isPurchase ? "ditambahkan ke stok" : "dikembalikan"}.
                        {isPurchase && totalAmount ? (
                            <span className="block mt-1 font-medium text-foreground">
                                Total: Rp {currencyFmt.format(totalAmount)}
                            </span>
                        ) : null}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
