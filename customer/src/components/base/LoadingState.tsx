import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useI18n";

interface LoadingStateProps {
    title?: string;
    message?: string;
    className?: string;
    spinnerClassName?: string;
}

export function LoadingState({
    title,
    message,
    className,
    spinnerClassName
}: LoadingStateProps) {
    const t = useTranslations("nearbyPage");
    return (
        <div className={cn("flex flex-col items-center justify-center py-8 px-4", className)}>
            <Loader2 className={cn("w-8 h-8 animate-spin text-primary mb-3", spinnerClassName)} />
            <h3 className="text-base font-medium text-foreground mb-1">
                {title || t('loadingNearby')}
            </h3>
            {message && <p className="text-muted-foreground text-sm text-center max-w-sm">{message}</p>}
        </div>
    );
}
