import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    footer?: React.ReactNode
    iconVariant?: "default" | "success" | "warning" | "danger"
    isLoading: boolean
}

export function KpiCard({
    title,
    value,
    icon,
    footer,
    iconVariant = "default",
    isLoading = false,
}: KpiCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    {isLoading ? (
                        <div className="h-8 w-28 rounded bg-muted animate-pulse" />
                    ) : (
                        <div className="text-3xl font-bold text-foreground">
                            {value}
                        </div>
                    )}
                </div>

                <div
                    className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center",
                        isLoading && "bg-muted text-muted-foreground",
                        !isLoading && {
                            "bg-muted text-foreground": iconVariant === "default",
                            "bg-success/10 text-success": iconVariant === "success",
                            "bg-warning/10 text-warning": iconVariant === "warning",
                            "bg-destructive/10 text-destructive": iconVariant === "danger",
                        }
                    )}
                >
                    {isLoading ? (
                        <div className="h-6 w-6 rounded bg-muted-foreground/30 animate-pulse" />
                    ) : (
                        icon
                    )}
                </div>
            </div>

            <div className="mt-4 text-sm">
                {isLoading ? (
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                ) : (
                    footer
                )}
            </div>
        </Card>
    )
}

export function MetaFooterKPIs({
    value,
    label,
    variant = "default",
}: {
    value: number
    label: string
    variant?: "default" | "danger"
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-1",
                variant === "danger"
                    ? "text-destructive"
                    : "text-muted-foreground"
            )}
        >
            <span className="font-medium text-foreground">
                {value}
            </span>
            <span>{label}</span>
        </div>
    )
}