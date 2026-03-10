"use client";

import React from "react";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export type PaymentMethodType = "cash" | "qris";

interface PaymentSectionProps {
    method: PaymentMethodType;
    onMethodChange: (method: PaymentMethodType) => void;
    total: number;
    cashReceived: number;
    onCashReceivedChange: (value: number) => void;
    qrisImageUrl?: string | null;
    isLoadingQris?: boolean;
}

const fmt = new Intl.NumberFormat("id-ID");

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export function PaymentSection({
    method,
    onMethodChange,
    total,
    cashReceived,
    onCashReceivedChange,
    qrisImageUrl,
    isLoadingQris,
}: PaymentSectionProps) {
    const change = cashReceived - total;
    const [showQrisModal, setShowQrisModal] = React.useState(false);

    const handleQrisMethodChange = () => {
        onMethodChange("qris");
        if (qrisImageUrl) {
            setShowQrisModal(true);
        }
    };

    const handleQuickAmount = (amount: number) => {
        onCashReceivedChange(amount);
    };

    const handleExactAmount = () => {
        onCashReceivedChange(total);
    };

    return (
        <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Metode Pembayaran</Label>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => onMethodChange("cash")}
                    className={cn(
                        "flex items-center gap-2 rounded-md border p-3 text-sm font-medium transition-all",
                        method === "cash"
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                            : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400",
                    )}>
                    <Banknote className="h-4 w-4" />
                    Cash
                </button>
                <button
                    type="button"
                    onClick={handleQrisMethodChange}
                    className={cn(
                        "flex items-center gap-2 rounded-md border p-3 text-sm font-medium transition-all",
                        method === "qris"
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                            : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400",
                    )}>
                    <QrCode className="h-4 w-4" />
                    QRIS
                </button>

                {/* Placeholder untuk metode tambahan di masa depan */}
                <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    <CreditCard className="h-4 w-4" />
                    Lainnya (segera)
                </button>
            </div>

            {method === "cash" && (
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="cashReceived" className="text-xs text-slate-600 dark:text-slate-400">
                            Nominal Diterima
                        </Label>
                        <Input
                            id="cashReceived"
                            type="number"
                            min={0}
                            value={cashReceived || ""}
                            onChange={(e) => onCashReceivedChange(Number(e.target.value))}
                            placeholder="0"
                            className="mt-1"
                        />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={handleExactAmount}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20">
                            Uang Pas
                        </button>
                        {QUICK_AMOUNTS.map((amount) => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => handleQuickAmount(amount)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                                {fmt.format(amount)}
                            </button>
                        ))}
                    </div>

                    {cashReceived > 0 && (
                        <div
                            className={cn(
                                "flex items-center justify-between rounded-md p-3 text-sm font-semibold",
                                change >= 0
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
                            )}>
                            <span>{change >= 0 ? "Kembalian" : "Kurang"}</span>
                            <span>Rp {fmt.format(Math.abs(change))}</span>
                        </div>
                    )}
                </div>
            )}

            {method === "qris" && (
                <div className="space-y-3">
                    {isLoadingQris && (
                        <div className="flex h-48 items-center justify-center rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
                            <p className="text-sm text-slate-400">Memuat QRIS...</p>
                        </div>
                    )}
                    {!isLoadingQris && qrisImageUrl && (
                        <div
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
                            onClick={() => setShowQrisModal(true)}>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Tap untuk perbesar · Scan QR berikut untuk pembayaran
                            </p>
                            <div className="relative h-56 w-56">
                                <Image
                                    src={qrisImageUrl}
                                    alt="QR Code Outlet"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            <p className="text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Total: Rp {fmt.format(total)}
                            </p>
                        </div>
                    )}
                    {!isLoadingQris && !qrisImageUrl && (
                        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-yellow-300 bg-yellow-50 p-4 text-center dark:border-yellow-600/40 dark:bg-yellow-500/10">
                            <QrCode className="h-8 w-8 text-yellow-500" />
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                QRIS belum diatur
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                Upload gambar QRIS outlet terlebih dahulu di halaman pengaturan.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* QRIS Popup Modal */}
            <Dialog open={showQrisModal} onOpenChange={setShowQrisModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Pembayaran QRIS</DialogTitle>
                        <DialogDescription>
                            Scan QR code berikut untuk melakukan pembayaran
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {qrisImageUrl && (
                            <>
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="relative w-full max-w-[360px] mx-auto aspect-square bg-white rounded-lg shadow-lg p-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={qrisImageUrl}
                                            alt="QRIS"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                                    <p className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-200">
                                        Total Pembayaran:
                                    </p>
                                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                        Rp {fmt.format(total)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Cara Pembayaran:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                        <li>Buka aplikasi mobile banking atau e-wallet Anda</li>
                                        <li>Pilih menu Scan QR atau QRIS</li>
                                        <li>Scan kode QR di atas</li>
                                        <li>Masukkan nominal pembayaran</li>
                                        <li>Konfirmasi pembayaran</li>
                                    </ol>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
