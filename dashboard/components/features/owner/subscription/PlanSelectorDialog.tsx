import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionPlanDetail } from "@/lib/apis/owner-subscription";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePlanFeatures, formatLimitLabel } from "./helper";

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
    open,
    onOpenChange,
    planOptions,
    selectedPlanCode,
    onSelectPlan,
    isLoading,
    isConfirming,
    shouldForcePlanSelection,
    onConfirm,
}: Props) {
    const selectedPlan = useMemo(
        () => planOptions.find((p) => p.code === selectedPlanCode) ?? null,
        [planOptions, selectedPlanCode],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Pilih paket langganan</DialogTitle>
                    <DialogDescription>
                        {shouldForcePlanSelection
                            ? 'Trial sudah dipakai. Pilih paket berbayar untuk melanjutkan langganan.'
                            : 'Pilih paket berbeda bila ingin upgrade atau downgrade sebelum perpanjang.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar paket...
                        </div>
                    ) : planOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Paket berbayar belum tersedia. Silakan hubungi tim dukungan.</p>
                    ) : (
                        planOptions.map((planOption) => {
                            const features = parsePlanFeatures(planOption.features);
                            const isActive = selectedPlanCode === planOption.code;

                            return (
                                <button
                                    type="button"
                                    key={planOption.code}
                                    onClick={() => onSelectPlan(planOption.code)}
                                    className={cn(
                                        'w-full rounded-lg border p-4 text-left transition hover:shadow-sm',
                                        isActive ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{planOption.name}</p>
                                            <p className="text-xs text-muted-foreground">Berlaku {planOption.durationDays} hari</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-foreground">{formatCurrency(planOption.price)}</p>
                                            <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wide">
                                                {planOption.code}
                                            </Badge>
                                        </div>
                                    </div>

                                    {features && (
                                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                            <span>Outlet: {formatLimitLabel(features.maxOutlets)}</span>
                                            <span>Produk: {formatLimitLabel(features.maxProducts)}</span>
                                            <span>Staff: {formatLimitLabel(features.maxStaff)}</span>
                                            <span>Dukungan: {features.supportLevel}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
                        Batal
                    </Button>
                    <Button onClick={onConfirm} disabled={!selectedPlan || isConfirming || planOptions.length === 0}>
                        {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Lanjutkan Pembayaran
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
