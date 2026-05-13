import { OutletData } from "@/hooks/useFavoriteState";
import { Heart } from "lucide-react";
import FavoriteOutletCard from "./FavoriteOutletCard";

export const FavoritesList = ({
    outlets,
    viewMode,
    isValidating,
    validationResults,
    onRemove,
    showOnlyAvailable,
    isLoading,
    t
}: any) => {

    // Skeleton
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3">
                        <div className="bg-muted rounded-lg h-32" />
                        <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty State (Filtered)
    if (outlets.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t('controls.noResults')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {showOnlyAvailable ? t('controls.tryDisablingFilter') : t('controls.emptyList')}
                </p>
            </div>
        );
    }

    return (
        <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid'
                ? 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1'
            }`}>
            {outlets.map((outlet: OutletData) => {
                const status = validationResults?.valid.some((v: any) => v.id === outlet.id) ? 'valid' :
                    validationResults?.invalid.some((v: any) => v.id === outlet.id) ? 'invalid' :
                        isValidating ? 'loading' : undefined;

                return (
                    <div
                        key={outlet.id}
                        className={`transition-all duration-200 ${viewMode === 'list' ? 'hover:scale-[1.01]' : 'hover:scale-105'
                            }`}
                    >
                        <FavoriteOutletCard
                            outlet={outlet}
                            isValidating={isValidating}
                            validationStatus={status}
                            onRemove={onRemove}
                            viewMode={viewMode}
                        />
                    </div>
                );
            })}
        </div>
    );
};