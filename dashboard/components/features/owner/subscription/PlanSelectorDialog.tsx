import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubscriptionPlanDetail } from "@/lib/apis/owner-subscription";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { formatLimitLabel, parsePlanFeatures } from "./helper";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

    const handleOpenChange = (open: boolean) => {
        if (!isConfirming && onOpenChange) {
            onOpenChange(open);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className=" p-0 overflow-hidden sm:rounded-2xl dark:border-slate-800">

                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                    <DialogTitle className="text-xl text-slate-900 dark:text-slate-50">
                        Pilih Paket Langganan
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-1.5">
                        {shouldForcePlanSelection
                            ? "Masa uji coba Anda telah berakhir. Pilih paket berbayar di bawah ini untuk melanjutkan akses penuh."
                            : "Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Upgrade atau downgrade kapan saja."}
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
                            <p className="text-sm font-medium">Memuat daftar paket terbaik untuk Anda...</p>
                        </div>
                    ) : planOptions.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <span className="text-2xl">📦</span>
                            </div>
                            <p className="text-base font-medium text-slate-900 dark:text-slate-100">Paket belum tersedia</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Saat ini tidak ada paket yang dapat dipilih. Silakan hubungi tim dukungan kami.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 pr-1">
                            {planOptions.map((planOption) => {
                                const features = parsePlanFeatures(planOption.features);
                                const isActive = selectedPlanCode === planOption.code;
                                const originalPrice = planOption.price;

                                return (
                                    <button
                                        type="button"
                                        key={planOption.code || planOption.id}
                                        onClick={() => onSelectPlan && onSelectPlan(planOption.code)}
                                        className={cn(
                                            "group relative w-full rounded-xl border-2 p-5 text-left transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30",
                                            isActive
                                                ? "border-indigo-600 bg-indigo-50/50 shadow-sm dark:border-indigo-500 dark:bg-indigo-500/10"
                                                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900/50"
                                        )}
                                    >
                                        {/* Badge Paling Populer */}
                                        {planOption.isPopular && (
                                            <div className="absolute -top-3 right-4">
                                                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                                                    <Sparkles className="h-3 w-3" /> Paling Populer
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            {/* Info Paket */}
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                                                        {planOption.name}
                                                    </h3>
                                                    {isActive && (
                                                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 border-0">
                                                            Terpilih
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    Masa aktif {planOption.durationDays || 0} hari
                                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">{planOption.code}</span>
                                                </p>
                                            </div>

                                            {/* Harga */}
                                            <div className="text-left sm:text-right shrink-0">
                                                {(planOption.promo || 0) > 0 && (
                                                    <p className="text-sm text-slate-400 dark:text-slate-500 line-through mb-0.5">
                                                        {formatCurrency(originalPrice)}
                                                    </p>
                                                )}
                                                <p className={cn(
                                                    "text-2xl font-black tracking-tight",
                                                    isActive ? "text-indigo-700 dark:text-indigo-400" : "text-slate-900 dark:text-slate-50"
                                                )}>
                                                    {formatCurrency(planOption.promo ? Number(planOption.promo) : planOption.price || 0)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Fitur Grid */}
                                        {features && Object.keys(features).length > 0 && (
                                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                                <ul className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                                                    {[
                                                        { label: "Batas Outlet", value: formatLimitLabel(features.maxOutlets) },
                                                        { label: "Batas Produk", value: formatLimitLabel(features.maxProducts) },
                                                        { label: "Batas Staff", value: formatLimitLabel(features.maxStaff) },
                                                        { label: "Dukungan", value: features.supportLevel || "Standard" },
                                                    ].map((feature, idx) => (
                                                        <li key={idx} className="flex items-start gap-2.5">
                                                            <CheckCircle2 className={cn(
                                                                "h-4 w-4 shrink-0 mt-0.5",
                                                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                                                            )} />
                                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                                {feature.label}: <span className="font-semibold text-slate-900 dark:text-slate-100">{feature.value}</span>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 sm:justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange && onOpenChange(false)}
                        disabled={isConfirming}
                        className="w-full sm:w-auto"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedPlan || isConfirming || planOptions.length === 0}
                        className="w-full sm:w-auto shadow-sm"
                    >
                        {isConfirming ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        Lanjutkan Pembayaran
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}