"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SubscriptionPlanDetail } from "@/lib/apis/owner-subscription";
import { Loader2, Crown, ShieldCheck, CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/features/auth";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planOptions: SubscriptionPlanDetail[];
    selectedPlanCode: string | null;
    onSelectPlan: (code: string) => void;
    isLoading: boolean;
    isConfirming: boolean;
    shouldForcePlanSelection: boolean;
    onConfirm: (billingCycle: number) => void;
}

export function PlanSelectorDialog({
    open = false,
    onOpenChange,
    planOptions = [],
    selectedPlanCode = null,
    onSelectPlan,
    isLoading = false,
    isConfirming = false,
    shouldForcePlanSelection = false,
    onConfirm,
}: Props) {
    const [billingCycle, setBillingCycle] = useState<number>(30);

    const selectedPlan = useMemo(
        () => planOptions.find((p) => p.code === selectedPlanCode) ?? null,
        [planOptions, selectedPlanCode]
    );

    const handleOpenChange = (open: boolean) => {
        if (!isConfirming) {
            setBillingCycle(30);
            onOpenChange(open);
        }
    };

    const handleConfirm = () => {
        onConfirm(billingCycle);
    };

    const yearlySavings = useMemo(() => {
        if (!selectedPlan || billingCycle !== 365 || !selectedPlan.yearlyPrice) return null;
        const monthlyTotal = selectedPlan.price * 12;
        const yearlyEffective = selectedPlan.yearlyPrice * (1 - selectedPlan.yearlyDiscount / 100);
        const savings = monthlyTotal - yearlyEffective;
        return {
            monthlyTotal,
            yearlyEffective,
            savings,
            savingsPercent: monthlyTotal > 0 ? Math.round((savings / monthlyTotal) * 100) : 0,
        };
    }, [selectedPlan, billingCycle]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/50 shadow-none bg-background rounded-xl">
                <DialogHeader className="p-6 border-b border-border/50 bg-muted">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-background text-muted-foreground flex items-center justify-center border border-border/50 shadow-none shrink-0">
                            <Crown className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <DialogTitle className="text-lg font-medium text-foreground">
                                Pilih Paket Langganan
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                {shouldForcePlanSelection
                                    ? "Masa uji coba berakhir. Pilih paket untuk melanjutkan."
                                    : "Tingkatkan kapasitas operasional bisnis Anda."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto px-4 space-y-4 bg-background">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm text-muted-foreground">Memuat paket...</p>
                        </div>
                    ) : planOptions.length === 0 ? (
                        <div className="text-center py-16 space-y-3">
                            <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl border border-border/50">
                                📦
                            </div>
                            <p className="text-sm font-medium">Tidak ada paket tersedia</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                                <button
                                    onClick={() => setBillingCycle(30)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        billingCycle === 30
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle(365)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        billingCycle === 365
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Yearly
                                </button>
                            </div>

                            <div className="grid gap-3">
                                {planOptions.map((planOption) => (
                                    <PlanCard
                                        key={planOption.code}
                                        plan={planOption as any}
                                        isSelected={selectedPlanCode === planOption.code}
                                        onSelectedChange={onSelectPlan}
                                        billingCycle={billingCycle}
                                    />
                                ))}
                            </div>

                            {yearlySavings && billingCycle === 365 && (
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                            Hemat dengan Yearly
                                        </span>
                                        <Badge className="bg-emerald-500 text-white">
                                            Hemat {yearlySavings.savingsPercent}%
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-muted-foreground line-through">
                                            {formatCurrency(yearlySavings.monthlyTotal)}
                                        </span>
                                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatCurrency(yearlySavings.yearlyEffective)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">/tahun</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-border/50 bg-muted gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isConfirming}
                    >
                        Nanti Saja
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedPlan || isConfirming || planOptions.length === 0}
                        className="gap-2"
                    >
                        {isConfirming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ShieldCheck className="h-4 w-4" />
                        )}
                        Konfirmasi & Bayar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}