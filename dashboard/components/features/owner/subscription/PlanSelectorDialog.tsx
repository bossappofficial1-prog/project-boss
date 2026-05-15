"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        if (!isConfirming && onOpenChange) {
            onOpenChange(open);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/80 shadow-xl bg-background rounded-md">
                <DialogHeader className="p-4 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-md bg-background text-foreground flex items-center justify-center border border-border shadow-sm">
                            <Crown className="text-primary h-7 w-7" />
                        </div>
                        <div className="space-y-0.5">
                            <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                                Pilih Paket Ekosistem
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium opacity-80">
                                {shouldForcePlanSelection
                                    ? "Masa uji coba berakhir. Pilih paket untuk melanjutkan."
                                    : "Tingkatkan kapasitas operasional bisnis Anda."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar bg-background">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="h-10 w-10 animate-spin mb-4 text-slate-400" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Menyiapkan Katalog...</p>
                        </div>
                    ) : planOptions.length === 0 ? (
                        <div className="text-center py-16 px-4 space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-md bg-muted/50 flex items-center justify-center text-3xl border border-border/40">
                                📦
                            </div>
                            <p className="text-lg font-black tracking-tight">Katalog Paket Kosong</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {planOptions.map((planOption) => <PlanCard key={planOption.code} plan={planOption as any} isSelected={selectedPlanCode === planOption.code} onSelectedChange={onSelectPlan} />)}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-border/40 bg-muted/30 sm:justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange && onOpenChange(false)}
                        disabled={isConfirming}
                    // className="h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-background border-border/60 hover:bg-muted/50 rounded-md shadow-none"
                    >
                        Nanti Saja
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedPlan || isConfirming || planOptions.length === 0}
                    // className="h-12 px-10 gap-3 font-black uppercase tracking-widest text-[10px] shadow-sm bg-foreground hover:bg-foreground/90 text-background rounded-md transition-all active:scale-95"
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