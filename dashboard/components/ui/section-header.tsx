import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type SectionHeaderProps = {
    title: string;
    description?: string;
    badge?: ReactNode;
    actions?: ReactNode;
    icon?: LucideIcon;
    withSeparator?: boolean;
};

export function SectionHeader({
    title,
    description,
    badge,
    actions,
    icon: Icon,
    withSeparator = false,
}: SectionHeaderProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="h-9 w-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center border border-border/50 shadow-none shrink-0">
                                <Icon className="h-5 w-5" />
                            </div>
                        )}
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        {badge}
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-2 shrink-0">{actions}</div>
                )}
            </div>

            {withSeparator && (
                <div className="border-t border-border/50" />
            )}
        </div>
    );
}