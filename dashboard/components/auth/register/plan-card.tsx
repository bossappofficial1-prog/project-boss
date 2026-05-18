import { SubcriptionPlan } from "@/hooks/useSubscriptionPlan"
import { SubscriptionPlanDetail, SubscriptionPlanFeatures } from "@/lib/apis/owner-subscription"
import { cn, formatCurrency } from "@/lib/utils"
import { CheckCircle2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type PlanCardProps = {
    plan: SubcriptionPlan | SubscriptionPlanDetail
    isSelected: boolean
    onSelectedChange: (selected: string) => void
    billingCycle?: number
}

export function PlanCard({ plan, isSelected, onSelectedChange, billingCycle = 30 }: PlanCardProps) {
    const visualFeatures = transformFeaturesToDisplay((plan.features || {}) as any)
    
    const isYearly = billingCycle === 365
    const hasYearlyPrice = plan.yearlyPrice && plan.yearlyPrice > 0
    
    let displayPrice: number
    let priceLabel: string
    let hasPromo = false
    let discount = 0

    if (isYearly && hasYearlyPrice) {
        displayPrice = plan.yearlyPrice * (1 - (plan.yearlyDiscount || 0) / 100)
        priceLabel = "/tahun"
        hasPromo = plan.yearlyDiscount > 0
        discount = plan.yearlyDiscount || 0
    } else {
        hasPromo = !!(plan.promo && plan.promo > 0)
        displayPrice = hasPromo ? plan.promo : plan.price
        priceLabel = `/${plan.durationDays} hari`
        discount = hasPromo
            ? Math.round(((plan.price - plan.promo!) / plan.price) * 100)
            : 0
    }

    return (
        <div
            onClick={() => onSelectedChange(plan.code)}
            className={cn(
                "relative rounded-lg border p-4 cursor-pointer",
                isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-border"
            )}
        >
            {plan.isPopular && (
                <Badge
                    className={cn(
                        "absolute -top-2.5 right-3 rounded-sm text-xs",
                        isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-chart-4 text-white"
                    )}
                >
                    Populer
                </Badge>
            )}

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground">
                        {plan.name}
                    </h3>

                    <div className="flex items-end gap-2 flex-wrap">
                        {hasPromo && (
                            <span className="text-xs line-through text-muted-foreground">
                                {formatCurrency(isYearly ? plan.yearlyPrice : plan.price)}
                            </span>
                        )}
                        <span className="text-xl font-semibold text-foreground tabular-nums">
                            {formatCurrency(displayPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {priceLabel}
                        </span>
                        {hasPromo && (
                            <Badge variant="outline" className="text-xs rounded-sm text-chart-3 border-chart-3/30 bg-chart-3/10">
                                -{discount}%
                            </Badge>
                        )}
                    </div>

                    {isYearly && hasYearlyPrice && (
                        <p className="text-xs text-muted-foreground">
                            Setara {formatCurrency(displayPrice / 12)}/bulan
                        </p>
                    )}
                </div>

                <div
                    className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected ? "border-primary" : "border-border"
                    )}
                >
                    {isSelected && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border/50">
                {visualFeatures.slice(0, 4).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                        {feat.allowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                        ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span
                            className={cn(
                                "truncate",
                                feat.allowed
                                    ? "text-foreground"
                                    : "text-muted-foreground line-through"
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
            label: features.maxOutlets === -1 ? "Outlet Tanpa Batas" : `Maks ${features.maxOutlets} Outlet`,
            allowed: true,
        },
        {
            label: features.maxProducts === -1 ? "Produk Tanpa Batas" : `Maks ${features.maxProducts} Produk`,
            allowed: true,
        },
        {
            label: features.maxStaff === -1 ? "Staff Tanpa Batas" : `Maks ${features.maxStaff} Staff`,
            allowed: true,
        },
        {
            label: "Ekspor Laporan",
            allowed: features.canExportReport,
        },
        {
            label:
                features.supportLevel === "PRIORITY"
                    ? "Dukungan Prioritas"
                    : features.supportLevel === "WHATSAPP"
                        ? "Dukungan WhatsApp"
                        : "Dukungan Email",
            allowed: true,
        },
    ]
}