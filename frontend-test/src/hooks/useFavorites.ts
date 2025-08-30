"use client";

import { useState, useEffect, useCallback } from 'react';

// Interface tetap sama
export interface FavoriteOutlet {
    id: string;
    name: string;
    address: string;
    image?: string;
    isOpen?: boolean;
    addedAt: number;
}

// Return type sedikit diubah untuk favoriteCount
interface UseFavoritesReturn {
    favorites: FavoriteOutlet[];
    favoriteCount: number; // Menjadi nilai, bukan fungsi
    isFavorite: (outletId: string) => boolean;
    addFavorite: (outlet: Omit<FavoriteOutlet, 'addedAt'>) => void;
    removeFavorite: (outletId: string) => void;
    toggleFavorite: (outlet: Omit<FavoriteOutlet, 'addedAt'>) => void;
    clearFavorites: () => void;
}

export function useFavorites(): UseFavoritesReturn {
    // HIGHLIGHT: Inisialisasi state langsung dari localStorage dalam satu langkah.
    // Ini menghindari render awal dengan state kosong lalu render kedua dengan data.
    const [favorites, setFavorites] = useState<FavoriteOutlet[]>(() => {
        // Cek ini penting agar tidak error saat Server-Side Rendering (SSR) di Next.js
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const stored = localStorage.getItem('favorite-outlets');
            if (stored) {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading favorites from localStorage:', error);
            return [];
        }
    });

    // HIGHLIGHT: Hanya butuh satu useEffect untuk menyimpan perubahan ke localStorage.
    useEffect(() => {
        try {
            localStorage.setItem('favorite-outlets', JSON.stringify(favorites));
        } catch (error) {
            console.error('Error saving favorites to localStorage:', error);
        }
    }, [favorites]); // Efek ini hanya berjalan ketika state `favorites` berubah.

    // HIGHLIGHT: Semua fungsi dibungkus dengan `useCallback` agar referensinya stabil.
    // Ini adalah kunci utama untuk mencegah infinite loop di komponen lain.

    const isFavorite = useCallback((outletId: string): boolean => {
        return favorites.some(fav => fav.id === outletId);
    }, [favorites]); // Bergantung pada `favorites` karena ia membaca state secara langsung.

    const addFavorite = useCallback((outlet: Omit<FavoriteOutlet, 'addedAt'>): void => {
        setFavorites(prev => {
            if (prev.some(fav => fav.id === outlet.id)) {
                return prev; // Jika sudah ada, jangan lakukan apa-apa
            }
            const newFavorite: FavoriteOutlet = { ...outlet, addedAt: Date.now() };
            return [newFavorite, ...prev];
        });
    }, []); // Dependency array kosong, super stabil!

    const removeFavorite = useCallback((outletId: string): void => {
        setFavorites(prev => prev.filter(fav => fav.id !== outletId));
    }, []); // Dependency array kosong, super stabil!

    const toggleFavorite = useCallback((outlet: Omit<FavoriteOutlet, 'addedAt'>): void => {
        setFavorites(prev => {
            const exists = prev.some(fav => fav.id === outlet.id);
            if (exists) {
                return prev.filter(fav => fav.id !== outlet.id);
            } else {
                const newFavorite: FavoriteOutlet = { ...outlet, addedAt: Date.now() };
                return [newFavorite, ...prev];
            }
        });
    }, []); // Dependency array kosong, super stabil!

    const clearFavorites = useCallback((): void => {
        setFavorites([]);
    }, []); // Dependency array kosong, super stabil!

    // HIGHLIGHT: Mengganti fungsi `getFavoriteCount` dengan nilai langsung.
    const favoriteCount = favorites.length;

    return {
        favorites,
        favoriteCount,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites
    };
}