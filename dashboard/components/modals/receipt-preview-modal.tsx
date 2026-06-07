"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ReceiptPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl?: string | null;
}

export function ReceiptPreviewModal({
    open,
    onOpenChange,
    imageUrl,
}: ReceiptPreviewModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 p-6 rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Preview Bukti Transaksi</DialogTitle>
                    <DialogDescription className="hidden">Bukti transaksi image preview</DialogDescription>
                </DialogHeader>

                <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt="Bukti Transaksi Full"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    ) : (
                        <p className="text-muted-foreground text-sm">Tidak ada gambar</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
