"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubscriptionPlanDetail } from "@/lib/apis/owner-subscription";
import { CheckCircle2, Loader2, Sparkles, Zap, Crown, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { formatLimitLabel, parsePlanFeatures } from "./helper";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

    // Ensure only the FIRST popular plan gets the badge to avoid visual clutter
    const popularPlanCode = useMemo(() => {
        return planOptions.find(p => p.isPopular)?.code;
    }, [planOptions]);

    const handleOpenChange = (open: boolean) => {
        if (!isConfirming && onOpenChange) {
            onOpenChange(open);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/80 shadow-xl bg-background rounded-md">
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-md bg-background text-foreground flex items-center justify-center border border-border shadow-sm">
                            <Crown className="h-7 w-7" />
                        </div>
                        <div className="space-y-0.5">
                            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
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

                <div className="max-h-[60vh] overflow-y-auto px-8 py-8 space-y-5 custom-scrollbar bg-background">
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
                        <div className="grid gap-5">
                            {planOptions.map((planOption) => {
                                const features = parsePlanFeatures(planOption.features);
                                const isActive = selectedPlanCode === planOption.code;
                                const isPopular = popularPlanCode === planOption.code;
                                const originalPrice = planOption.price;

                                return (
                                    <button
                                        type="button"
                                        key={planOption.code || planOption.id}
                                        onClick={() => onSelectPlan && onSelectPlan(planOption.code)}
                                        className={cn(
                                            "group relative w-full rounded-md border-2 p-6 text-left transition-all duration-200 ease-out focus:outline-none",
                                            isActive
                                                ? "border-foreground bg-muted/30 shadow-sm"
                                                : "border-border/60 bg-background hover:border-border hover:bg-muted/30"
                                        )}
                                    >
                                        {/* Recommendation Badge */}
                                        {isPopular && (
                                            <div className="absolute -top-3 right-8">
                                                <span className="flex items-center gap-1.5 rounded-md bg-foreground px-4 py-1 text-[9px] font-black uppercase tracking-widest text-background shadow-sm">
                                                    <Sparkles className="h-3 w-3 text-amber-400" /> Rekomendasi
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className={cn(
                                                        "text-xl font-black tracking-tight",
                                                        isActive ? "text-foreground" : "text-foreground"
                                                    )}>
                                                        {planOption.name}
                                                    </h3>
                                                    {isActive && (
                                                        <div className="h-6 w-6 rounded-md bg-foreground text-background flex items-center justify-center shadow-sm">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                        <Zap className="h-3 w-3 fill-amber-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">{planOption.durationDays || 0} Hari</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-tighter text-muted-foreground opacity-40">
                                                        {planOption.code}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-left sm:text-right shrink-0">
                                                {(planOption.promo || 0) > 0 && (
                                                    <p className="text-[10px] font-bold text-muted-foreground/50 line-through tracking-tight mb-1">
                                                        {formatCurrency(originalPrice)}
                                                    </p>
                                                )}
                                                <div className={cn(
                                                    "px-4 py-2 rounded-md border transition-colors",
                                                    isActive ? "bg-foreground text-background border-foreground shadow-sm" : "bg-muted/30 text-foreground border-border/40"
                                                )}>
                                                    <p className="text-2xl font-black tracking-tighter">
                                                        {formatCurrency(planOption.promo ? Number(planOption.promo) : planOption.price || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Features Highlight */}
                                        {features && Object.keys(features).length > 0 && (
                                            <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[
                                                    { label: "Outlet", value: formatLimitLabel(features.maxOutlets) },
                                                    { label: "Produk", value: formatLimitLabel(features.maxProducts) },
                                                    { label: "Staff", value: formatLimitLabel(features.maxStaff) },
                                                    { label: "Support", value: features.supportLevel === 'PRIORITY' ? 'Direct' : 'Standard' },
                                                ].map((feature, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-60">{feature.label}</p>
                                                        <p className="text-[10px] font-black text-foreground truncate uppercase">{feature.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-8 py-6 border-t border-border/40 bg-muted/30 sm:justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange && onOpenChange(false)}
                        disabled={isConfirming}
                        className="h-12 px-6 font-black uppercase tracking-widest text-[10px] bg-background border-border/60 hover:bg-muted/50 rounded-md shadow-none"
                    >
                        Nanti Saja
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedPlan || isConfirming || planOptions.length === 0}
                        className="h-12 px-10 gap-3 font-black uppercase tracking-widest text-[10px] shadow-sm bg-foreground hover:bg-foreground/90 text-background rounded-md transition-all active:scale-95"
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