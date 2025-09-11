import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-8 px-4", className)}>
            <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                {icon || <Package className="w-6 h-6 text-muted-foreground" />}
            </div>
            <h3 className="text-base font-medium text-foreground mb-1 text-center">{title}</h3>
            {description && (
                <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick} variant="default" size="sm">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
