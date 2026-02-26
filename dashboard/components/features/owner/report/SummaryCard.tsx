import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    highlight?: boolean;
    description?: string;
    isCurrency?: boolean;
}

export function SummaryCard({
    title,
    value,
    icon,
    isCurrency = true,
    highlight = false,
    description
}: SummaryCardProps) {

    const displayValue = typeof value === "number" && isCurrency
        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
        : value;

    return (
        <Card
            className={cn(
                "relative overflow-hidden py-0 transition-all duration-200 shadow-sm hover:shadow-md",
                "border-l-[4px]",
                highlight
                    ? "border-l-emerald-500 border-t-border/60 border-r-border/60 border-b-border/60 bg-emerald-50/40 dark:bg-emerald-500/10"
                    : "border-l-primary/10 border-border bg-card hover:border-l-primary/40"
            )}
        >
            <CardContent className="p-5">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                        {title}
                    </p>
                    {/* Icon Container */}
                    {icon && (
                        <div className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            highlight ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )}>
                            {icon}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <div className={cn(
                        "text-2xl font-bold tracking-tight",
                        highlight ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                    )}>
                        {displayValue}
                    </div>

                    {description && (
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}