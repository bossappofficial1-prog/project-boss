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
import { Loader2, Crown, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/auth/register/plan-card";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planOptions: SubscriptionPlanDetail[];
    selectedPlanCode: string | null;
    onSelectPlan: (code: string) => void;
    isLoading: boolean;
    isConfirming: boolean;
    shouldForcePlanSelection: boolean;
    onConfirm: () => void;
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
    const selectedPlan = useMemo(
        () => planOptions.find((p) => p.code === selectedPlanCode) ?? null,
        [planOptions, selectedPlanCode]
    );

    const handleOpenChange = (open: boolean) => {
        if (!isConfirming) onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/50 shadow-none bg-background rounded-xl">
                {/* Header */}
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

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3 bg-background">
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
                        <div className="grid gap-3">
                            {planOptions.map((planOption) => (
                                <PlanCard
                                    key={planOption.code}
                                    plan={planOption as any}
                                    isSelected={selectedPlanCode === planOption.code}
                                    onSelectedChange={onSelectPlan}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 border-t border-border/50 bg-muted gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isConfirming}
                    >
                        Nanti Saja
                    </Button>
                    <Button
                        onClick={onConfirm}
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