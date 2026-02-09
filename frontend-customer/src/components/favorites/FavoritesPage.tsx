'use client'

import { useRouter } from "next/navigation";
import { FilterBar } from "./FilterBar";
import { useTranslations } from "@/hooks/useI18n";
import { useFavorites } from "@/hooks/useFavorites";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useFavoritesState } from "@/hooks/useFavoriteState";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../Base";
import { Heart } from "lucide-react";
import { ValidationAlert } from "./ValidationAlert";
import { FavoritesList } from "./FavoritesList";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

export default function FavoritesPage() {
    const router = useRouter();
    const t = useTranslations('favorites');
    const { favorites, clearFavorites, removeFavorite } = useFavorites();
    const { setAppBar, resetAppBar } = useAppBarV2();

    // State Management
    const {
        sortBy, setSortBy,
        viewMode, setViewMode,
        showOnlyAvailable, setShowOnlyAvailable,
        validationResults,
        processedFavorites,
        isValidating,
        isLoading
    } = useFavoritesState(favorites);

    const [showValidationAlert, setShowValidationAlert] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);

    const invalidCount = validationResults?.invalid?.length || 0;
    const validCount = validationResults?.valid?.length || 0;

    // Manage App Bar
    useEffect(() => {
        setAppBar({
            title: t('title'),
            subtitle: validCount > 0 ? t('controls.availableOutlets', { count: validCount }) : t('subtitle'),
            showSearch: false,
            centerTitle: true,
            showBackButton: true,
        });
        return () => resetAppBar();
    }, [setAppBar, resetAppBar, t, validCount]);

    // Show alert if invalid items exist
    useEffect(() => {
        if (invalidCount > 0) setShowValidationAlert(true);
    }, [invalidCount]);

    const handleRemoveInvalidOutlets = useCallback(() => {
        if (validationResults?.invalid) {
            validationResults.invalid.forEach(outlet => removeFavorite(outlet.id));
            setShowValidationAlert(false);
        }
    }, [validationResults, removeFavorite]);

    const handleBrowseOutlets = () => router.push('/nearby');

    // 1. Check Empty State (Global)
    if (!isLoading && favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <EmptyState
                    title={t('empty.title')}
                    description={t('empty.description')}
                    icon={<Heart className="w-6 h-6 text-muted-foreground" />}
                    action={{ label: t('empty.browse'), onClick: handleBrowseOutlets }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <FilterBar
                totalCount={favorites.length}
                shownCount={processedFavorites.length}
                invalidCount={invalidCount}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
                showOnlyAvailable={showOnlyAvailable}
                setShowOnlyAvailable={setShowOnlyAvailable}
                onClearRequest={() => setShowClearDialog(true)}
                t={t}
            />

            <div className="container mx-auto px-4 sm:px-0">
                {/* Validation Alert */}
                {showValidationAlert && invalidCount > 0 && (
                    <ValidationAlert
                        count={invalidCount}
                        onRemoveInvalid={handleRemoveInvalidOutlets}
                        onDismiss={() => setShowValidationAlert(false)}
                        t={t}
                    />
                )}

                {/* Main List */}
                <FavoritesList
                    outlets={processedFavorites}
                    viewMode={viewMode}
                    isValidating={isValidating}
                    validationResults={validationResults}
                    onRemove={removeFavorite}
                    showOnlyAvailable={showOnlyAvailable}
                    isLoading={isLoading}
                    t={t}
                />
            </div>

            {/* Clear Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent className="sm:max-w-sm rounded-lg">
                    <DialogHeader>
                        <DialogTitle>{t('confirm.clearAllTitle')}</DialogTitle>
                        <DialogDescription>{t('confirm.clearAllDesc')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowClearDialog(false)}>
                            {t('buttons.cancel')}
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => { clearFavorites(); setShowClearDialog(false); }}>
                            {t('confirm.clear')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}