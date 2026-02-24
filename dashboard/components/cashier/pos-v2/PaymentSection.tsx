"use client";

import React from "react";
import { Banknote, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PaymentMethodType = "cash";

interface PaymentSectionProps {
    method: PaymentMethodType;
    onMethodChange: (method: PaymentMethodType) => void;
    total: number;
    cashReceived: number;
    onCashReceivedChange: (value: number) => void;
}

const fmt = new Intl.NumberFormat("id-ID");

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export function PaymentSection({
    method,
    onMethodChange,
    total,
    cashReceived,
    onCashReceivedChange,
}: PaymentSectionProps) {
    const change = cashReceived - total;

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
        </div>
    );
}
