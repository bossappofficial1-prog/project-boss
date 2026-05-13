import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { useTranslations } from "@/hooks/useI18n";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
    icon?: React.ReactNode;
    iconClassName?: string
}

export function ErrorState({
    title,
    message,
    onRetry,
    className,
    icon,
    iconClassName
}: ErrorStateProps) {
    const t = useTranslations("nearbyPage");
    return (
        <div className={cn("flex flex-col items-center justify-center py-8 px-4", className)}>
            <div className={`w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center ${iconClassName}`}>
                {icon ? icon : <AlertTriangle className="w-6 h-6 text-red-500" />}
            </div>
            <h3 className="text-base font-medium text-foreground mb-1 text-center">
                {title || t('somethingWrong')}
            </h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                {message || t('failedToLoad')}
            </p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('retry')}
                </Button>
            )}
        </div>
    );
}
