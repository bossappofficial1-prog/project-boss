import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    variant?: "default" | "success" | "destructive" | "warning" | "info";
    highlight?: boolean;
    description?: string;
    isCurrency?: boolean;
    tooltip?: React.ReactNode;
}

export function SummaryCard({
    title,
    value,
    icon,
    isCurrency = true,
    variant = "default",
    highlight = false,
    description,
    tooltip
}: SummaryCardProps) {

    const displayValue = typeof value === "number" && isCurrency
        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
        : value;

    const variantStyles = {
        default: "border-l-primary/20",
        success: "border-l-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10",
        destructive: "border-l-rose-500 bg-rose-500/5 hover:bg-rose-500/10",
        warning: "border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10",
        info: "border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10",
    };

    const textStyles = {
        default: "text-foreground",
        success: "text-emerald-600 dark:text-emerald-400",
        destructive: "text-rose-600 dark:text-rose-400",
        warning: "text-amber-600 dark:text-amber-400",
        info: "text-blue-600 dark:text-blue-400",
    };

    return (
        <Card
            className={cn(
                "relative overflow-hidden py-0 transition-all duration-300 shadow-sm border-border/80 border-l-[3px] rounded-md",
                highlight ? variantStyles[variant] : "bg-background hover:bg-muted/30"
            )}
        >
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70 truncate">
                            {title}
                        </p>
                        {tooltip && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
                                        <HelpCircle className="h-3 w-3" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 text-xs text-muted-foreground border-border bg-card shadow-2xl p-4 rounded-md">
                                   {tooltip}
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                    {icon && (
                        <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center border border-border/40 shadow-sm shrink-0",
                            highlight ? "bg-background/80" : "bg-muted/50"
                        )}>
                            <div className={cn("h-3.5 w-3.5", highlight ? textStyles[variant] : "text-muted-foreground")}>
                                {icon}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className={cn(
                        "text-xl sm:text-2xl font-bold tracking-tight tabular-nums",
                        highlight ? textStyles[variant] : "text-foreground/90"
                    )}>
                        {displayValue}
                    </div>

                    {description && (
                        <p className="text-[10px] font-medium text-muted-foreground/60 leading-tight">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}