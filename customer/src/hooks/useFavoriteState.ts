import { useEffect, useMemo, useState } from "react";

export interface OutletData {
    id: string;
    name: string;
    address: string;
    image?: string;
    isOpen?: boolean;
    addedAt: number;
    isValid?: boolean;
}

export type SortOption = 'name' | 'distance' | 'dateAdded' | 'status';
export type ViewMode = 'grid' | 'list';

export const useFavoritesState = (favorites: OutletData[]) => {
    // Initialize with defaults to prevent hydration mismatch
    const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState(false);

    // Hydrate state from localStorage on client-side only
    useEffect(() => {
        setIsMounted(true);
        const storedSort = localStorage.getItem('fav-sort') as SortOption;
        const storedView = localStorage.getItem('fav-view') as ViewMode;
        const storedAvailable = localStorage.getItem('fav-available-only');

        if (storedSort) setSortBy(storedSort);
        if (storedView) setViewMode(storedView);
        if (storedAvailable) setShowOnlyAvailable(storedAvailable === '1');
    }, []);

    // Persist changes
    useEffect(() => {
        if (isMounted) localStorage.setItem('fav-sort', sortBy);
    }, [sortBy, isMounted]);

    useEffect(() => {
        if (isMounted) localStorage.setItem('fav-view', viewMode);
    }, [viewMode, isMounted]);

    useEffect(() => {
        if (isMounted) localStorage.setItem('fav-available-only', showOnlyAvailable ? '1' : '0');
    }, [showOnlyAvailable, isMounted]);

    // Validation Logic (Simulated)
    const [validationResults, setValidationResults] = useState<{
        valid: OutletData[];
        invalid: OutletData[];
    } | null>(null);

    useEffect(() => {
        if (favorites.length > 0) {
            // Simulate validation check
            setValidationResults({
                valid: favorites, // Assume all valid for demo
                invalid: []
            });
        } else {
            setValidationResults(null);
        }
    }, [favorites]);

    // Filtering & Sorting Logic
    const processedFavorites = useMemo(() => {
        if (!validationResults) return favorites;

        let allOutlets = [
            ...validationResults.valid.map(o => ({ ...o, isValid: true })),
            ...validationResults.invalid.map(o => ({ ...o, isValid: false }))
        ];

        if (showOnlyAvailable) {
            allOutlets = allOutlets.filter(outlet => outlet.isValid);
        }

        return allOutlets.sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'dateAdded': return b.addedAt - a.addedAt;
                case 'status':
                    if (a.isValid && !b.isValid) return -1;
                    if (!a.isValid && b.isValid) return 1;
                    return 0;
                default: return 0;
            }
        });
    }, [validationResults, favorites, showOnlyAvailable, sortBy]);

    return {
        sortBy, setSortBy,
        viewMode, setViewMode,
        showOnlyAvailable, setShowOnlyAvailable,
        validationResults,
        processedFavorites,
        isValidating: false, // Could be real state
        isLoading: !isMounted // Show loading until hydrated
    };
};