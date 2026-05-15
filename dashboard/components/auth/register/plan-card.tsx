import { SubcriptionPlan } from "@/hooks/useSubscriptionPlan"
import { SubscriptionPlanDetail, SubscriptionPlanFeatures } from "@/lib/apis/owner-subscription"
import { cn, formatCurrency } from "@/lib/utils"
import { CheckCircle2, X } from "lucide-react"

type PlanCardProps = {
    plan: SubcriptionPlan | SubscriptionPlanDetail,
    isSelected: boolean,
    onSelectedChange: (selected: string) => void
}

export function PlanCard({ plan, isSelected, onSelectedChange }: PlanCardProps) {
    const visualFeatures = transformFeaturesToDisplay((plan.features || {}) as any)
    const hasPromo = plan.promo && plan.promo > 0
    const finalPrice = hasPromo ? plan.promo : plan.price
    const discount = hasPromo
        ? Math.round(((plan.price - plan.promo) / plan.price) * 100)
        : 0

    return (
        <div
            key={plan.code}
            onClick={() => onSelectedChange(plan.code)}
            className={cn(
                "relative rounded-xl border p-4 cursor-pointer transition-all duration-200",
                "hover:shadow-md hover:-translate-y-[1px]",
                isSelected
                    ? "border-red-500 bg-red-50/40 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
            )}
        >
            {/* Badge Popular */}
            {plan.isPopular && (
                <span
                    className={cn(
                        "absolute -top-2 right-3 px-3 py-1 text-[10px] font-bold rounded-full shadow-sm",
                        isSelected
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-white"
                    )}
                >
                    POPULER
                </span>
            )}

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                        {plan.name}
                    </h3>

                    {/* PRICE */}
                    <div className="mt-1 flex items-end gap-2 flex-wrap">
                        {hasPromo && (
                            <span className="text-xs line-through text-slate-400">
                                {formatCurrency(plan.price)}
                            </span>
                        )}

                        <span className="text-xl font-bold text-slate-900">
                            {formatCurrency(finalPrice)}
                        </span>

                        <span className="text-xs text-slate-500">
                            / {plan.durationDays} hari
                        </span>

                        {hasPromo && (
                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                -{discount}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Radio Indicator */}
                <div
                    className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected
                            ? "border-red-600"
                            : "border-slate-300"
                    )}
                >
                    {isSelected && (
                        <div className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    )}
                </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-100">
                {visualFeatures.slice(0, 4).map((feat, idx) => (
                    <div key={idx} className="flex items-center text-xs">
                        {feat.allowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
                        ) : (
                            <X className="h-3.5 w-3.5 mr-1.5 text-slate-300 flex-shrink-0" />
                        )}

                        <span
                            className={cn(
                                "truncate",
                                feat.allowed
                                    ? "text-slate-700"
                                    : "text-slate-400 line-through"
                            )}
                        >
                            {feat.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

const transformFeaturesToDisplay = (features: SubscriptionPlanFeatures) => {
    return [
        {
            label: features.maxOutlets === -1 ? 'Outlet Tanpa Batas' : `Maks ${features.maxOutlets} Outlet`,
            allowed: true
        },
        {
            label: features.maxProducts === -1 ? 'Produk Tanpa Batas' : `Maks ${features.maxProducts} Produk`,
            allowed: true
        },
        {
            label: features.maxStaff === -1 ? 'Staff Tanpa Batas' : `Maks ${features.maxStaff} Staff`,
            allowed: true
        },
        {
            label: 'Ekspor Laporan',
            allowed: features.canExportReport
        },
        {
            label: features.supportLevel === 'PRIORITY' ? 'Dukungan Prioritas' : features.supportLevel === 'WHATSAPP' ? 'Dukungan WhatsApp' : 'Dukungan Email',
            allowed: true
        },
    ];
};