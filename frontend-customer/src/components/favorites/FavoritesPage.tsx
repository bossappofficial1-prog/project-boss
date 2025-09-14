'use client'

import { useLayoutEffect, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { useTranslations } from '@/hooks/useI18n';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState, LoadingState } from '@/components/Base';
import FavoriteOutletCard from './FavoriteOutletCard';
import { Heart, AlertTriangle, RefreshCw, Filter, SortAsc, Grid, List, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type SortOption = 'name' | 'distance' | 'dateAdded' | 'status';
type ViewMode = 'grid' | 'list';

export default function FavoritesPage() {
    const { favorites, clearFavorites, removeFavorite } = useFavorites();
    const { setAppBar, resetAppBar } = useAppBarV2();
    const t = useTranslations('favorites');
    const router = useRouter();
    // AppBar will be set on mount and reset on unmount
    const [showValidationAlert, setShowValidationAlert] = useState(false);

    const [sortBy, setSortBy] = useState<SortOption>(() => (typeof window !== 'undefined' ? (localStorage.getItem('fav-sort') as SortOption) || 'dateAdded' : 'dateAdded'));
    const [viewMode, setViewMode] = useState<ViewMode>(() => (typeof window !== 'undefined' ? (localStorage.getItem('fav-view') as ViewMode) || 'grid' : 'grid'));
    const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(() => (typeof window !== 'undefined' ? localStorage.getItem('fav-available-only') === '1' : false));
    const [showClearDialog, setShowClearDialog] = useState(false);

    useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('fav-sort', sortBy); }, [sortBy]);
    useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('fav-view', viewMode); }, [viewMode]);
    useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('fav-available-only', showOnlyAvailable ? '1' : '0'); }, [showOnlyAvailable]);

    const [validationResults, setValidationResults] = useState<{
        valid: Array<{ id: string; name: string; address: string; image?: string; isOpen?: boolean; addedAt: number; }>;
        invalid: Array<{ id: string; name: string; address: string; image?: string; isOpen?: boolean; addedAt: number; }>;
    } | null>(null);
    const isValidating = false;
    const isLoading = false; // Add proper loading state as needed

    // Mock validation - assume all favorites are valid for now
    useEffect(() => {
        if (favorites.length > 0) {
            setValidationResults({
                valid: favorites,
                invalid: []
            });
        }
    }, [favorites]);

    // Custom Skeleton Component
    const CustomSkeleton = () => (
        <div className="animate-pulse">
            <div className="bg-muted rounded-lg h-32 mb-3"></div>
            <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="flex gap-2">
                    <div className="h-5 bg-muted rounded w-16"></div>
                    <div className="h-5 bg-muted rounded w-12"></div>
                </div>
            </div>
        </div>
    );    // Auto remove invalid outlets
    const handleRemoveInvalidOutlets = useCallback(() => {
        if (validationResults?.invalid) {
            validationResults.invalid.forEach((outlet: any) => {
                removeFavorite(outlet.id);
            });
            setShowValidationAlert(false);
        }
    }, [validationResults?.invalid, removeFavorite]);

    const invalidCount = validationResults?.invalid?.length || 0;
    const validCount = validationResults?.valid?.length || 0;

    // Sorted and filtered favorites
    const processedFavorites = useMemo(() => {
        if (!validationResults) return favorites;

        let allOutlets = [
            ...validationResults.valid.map((outlet: any) => ({ ...outlet, isValid: true })),
            ...validationResults.invalid.map((outlet: any) => ({ ...outlet, isValid: false }))
        ];

        // Filter berdasarkan ketersediaan
        if (showOnlyAvailable) {
            allOutlets = allOutlets.filter(outlet => outlet.isValid);
        }

        // Sorting
        allOutlets.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'dateAdded':
                    return b.addedAt - a.addedAt; // Terbaru dulu
                case 'status':
                    // Valid outlets pertama
                    if (a.isValid && !b.isValid) return -1;
                    if (!a.isValid && b.isValid) return 1;
                    return 0;
                default:
                    return 0;
            }
        });

        return allOutlets;
    }, [validationResults, favorites, showOnlyAvailable, sortBy]);

    const rightContent = useMemo(() => {
        if (favorites.length === 0) return null;
        return (
            <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center bg-muted rounded-lg p-1">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-7 w-7 p-0"><Grid className="w-3 h-3" /></Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 w-7 p-0"><List className="w-3 h-3" /></Button>
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger size="sm" className="h-7 text-xs">
                        <SelectValue placeholder={t('sort.label')} />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                        <SelectItem value="dateAdded">{t('sort.dateAdded')}</SelectItem>
                        <SelectItem value="name">{t('sort.name')}</SelectItem>
                        <SelectItem value="status">{t('sort.status')}</SelectItem>
                    </SelectContent>
                </Select>
                {invalidCount > 0 && <Badge variant="destructive" className="text-xs">{invalidCount}</Badge>}
            </div>
        );
    }, [favorites.length, invalidCount, viewMode, sortBy, t]);

    const appBarConfig = useMemo(() => ({
        title: t('title'),
        subtitle: validCount > 0 ? t('controls.availableOutlets', { count: validCount }) : t('subtitle'),
        showSearch: false,
        centerTitle: true,
        showBackButton: true,
        rightContent
    }), [t, validCount, rightContent]);

    useEffect(() => {
        setAppBar({ ...appBarConfig });
        return () => {
            resetAppBar();
        };
    }, [setAppBar, resetAppBar, appBarConfig]);

    // Show validation alert when invalid outlets are found
    useEffect(() => {
        if (invalidCount > 0 && !showValidationAlert) {
            setShowValidationAlert(true);
        }
    }, [invalidCount, showValidationAlert]);

    const handleBrowseOutlets = () => {
        router.push('/nearby');
    };

    // Loading state
    if (favorites.length > 0 && isValidating && !validationResults) {
        return <LoadingState message={t('loading.checking')} />;
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <EmptyState
                    title={t('empty.title')}
                    description={t('empty.description')}
                    icon={<Heart className="w-6 h-6 text-muted-foreground" />}
                    action={{
                        label: t('empty.browse'),
                        onClick: handleBrowseOutlets
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Controls */}
            {favorites.length > 0 && (
                <div className="border-b bg-background/70 backdrop-blur-sm top-16 left-0 z-20 px-3 pt-2 pb-3 space-y-3">
                    {/* Desktop Row */}
                    <div className="hidden sm:flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Button variant={showOnlyAvailable ? 'default' : 'outline'} size="sm" onClick={() => setShowOnlyAvailable(!showOnlyAvailable)} className="gap-1 text-xs">
                                <Filter className="w-3 h-3" />{t('controls.availableOnly')}
                            </Button>
                            {invalidCount > 0 && <Badge variant="secondary" className="text-xs">{invalidCount} {t('validation.unavailable')}</Badge>}
                            {favorites.length > 1 && (
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowClearDialog(true)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>{t('controls.resultsCount', { shown: processedFavorites.length, total: favorites.length })}</span>
                        </div>
                    </div>
                    {/* Mobile Horizontal Scroll Chips */}
                    <div className="flex sm:hidden items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                        <Button variant={showOnlyAvailable ? 'default' : 'outline'} size="sm" onClick={() => setShowOnlyAvailable(!showOnlyAvailable)} className="gap-1 text-[11px] h-7">
                            <Filter className="w-3 h-3" />{t('controls.availableOnly')}
                        </Button>
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger size="sm" className="h-7 text-[11px]">
                                <SelectValue placeholder={t('sort.label')} />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="dateAdded">{t('sort.dateAdded')}</SelectItem>
                                <SelectItem value="name">{t('sort.name')}</SelectItem>
                                <SelectItem value="status">{t('sort.status')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center bg-muted rounded-lg p-1">
                            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-7 w-7 p-0"><Grid className="w-3 h-3" /></Button>
                            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 w-7 p-0"><List className="w-3 h-3" /></Button>
                        </div>
                        {invalidCount > 0 && <Badge variant="destructive" className="text-[11px] h-7 flex items-center">{invalidCount}</Badge>}
                        {favorites.length > 1 && (
                            <Button variant="outline" size="sm" className="gap-1 h-7 text-[11px]" onClick={() => setShowClearDialog(true)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                        <span className="ml-auto pr-1 text-[11px] text-muted-foreground whitespace-nowrap">{processedFavorites.length}/{favorites.length}</span>
                    </div>
                </div>
            )}

            {/* Validation Alert */}
            {showValidationAlert && invalidCount > 0 && (
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-medium text-destructive">
                                    {t('alert.unavailableTitle', { count: invalidCount })}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('alert.unavailableDescription')}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleRemoveInvalidOutlets}
                                    >
                                        {t('buttons.removeUnavailable')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowValidationAlert(false)}
                                    >
                                        {t('buttons.dismiss')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className={`grid gap-3 sm:gap-4 sm:px-0 ${viewMode === 'grid'
                ? 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1'
                }`}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <CustomSkeleton key={i} />
                    ))
                ) : processedFavorites.length > 0 ? (
                    processedFavorites.map((outlet) => (
                        <div
                            key={outlet.id}
                            className={`transition-all duration-200 ${viewMode === 'list' ? 'hover:scale-[1.01]' : 'hover:scale-105'
                                }`}
                        >
                            <FavoriteOutletCard
                                outlet={outlet}
                                isValidating={isValidating}
                                validationStatus={
                                    validationResults?.valid.some((v: any) => v.id === outlet.id) ? 'valid' :
                                        validationResults?.invalid.some((v: any) => v.id === outlet.id) ? 'invalid' :
                                            isValidating ? 'loading' : undefined
                                }
                                onRemove={removeFavorite}
                                viewMode={viewMode}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            {showOnlyAvailable && invalidCount > 0
                                ? t('controls.noAvailableOutlets')
                                : t('controls.noFavoritesYet')
                            }
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            {showOnlyAvailable && invalidCount > 0
                                ? t('controls.allUnavailableDescription')
                                : t('controls.startExploringDescription')
                            }
                        </p>
                        {showOnlyAvailable && invalidCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOnlyAvailable(false)}
                                className="mt-4"
                            >
                                {t('buttons.showAllFavorites')}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Clear All Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base">{t('confirm.clearAllTitle')}</DialogTitle>
                        <DialogDescription className="text-sm">{t('confirm.clearAllDesc')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row sm:flex-row justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" className='flex-1' onClick={() => setShowClearDialog(false)}>{t('buttons.cancel')}</Button>
                        <Button variant="destructive" size="sm" className='flex-1' onClick={() => { clearFavorites(); setShowClearDialog(false); }}>{t('confirm.clear')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
