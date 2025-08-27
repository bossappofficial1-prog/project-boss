"use client";

import { useState, useEffect } from 'react';

export interface FavoriteOutlet {
    id: string;
    name: string;
    address: string;
    image?: string;
    isOpen?: boolean;
    addedAt: number;
}

interface UseFavoritesReturn {
    favorites: FavoriteOutlet[];
    isFavorite: (outletId: string) => boolean;
    addFavorite: (outlet: Omit<FavoriteOutlet, 'addedAt'>) => void;
    removeFavorite: (outletId: string) => void;
    toggleFavorite: (outlet: Omit<FavoriteOutlet, 'addedAt'>) => void;
    clearFavorites: () => void;
    getFavoriteCount: () => number;
}

export function useFavorites(): UseFavoritesReturn {
    const [favorites, setFavorites] = useState<FavoriteOutlet[]>([]);
    const [isClient, setIsClient] = useState(false);

    // Load favorites from localStorage on mount
    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('favorite-outlets');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setFavorites(Array.isArray(parsed) ? parsed : []);
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
                setFavorites([]);
            }
        }
    }, []);

    // Save favorites to localStorage whenever favorites change
    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            try {
                localStorage.setItem('favorite-outlets', JSON.stringify(favorites));
            } catch (error) {
                console.error('Error saving favorites:', error);
            }
        }
    }, [favorites, isClient]);

    const isFavorite = (outletId: string): boolean => {
        return favorites.some(fav => fav.id === outletId);
    };

    const addFavorite = (outlet: Omit<FavoriteOutlet, 'addedAt'>): void => {
        const newFavorite: FavoriteOutlet = {
            ...outlet,
            addedAt: Date.now()
        };

        setFavorites(prev => {
            // Check if already exists
            if (prev.some(fav => fav.id === outlet.id)) {
                return prev;
            }
            return [newFavorite, ...prev];
        });
    };

    const removeFavorite = (outletId: string): void => {
        setFavorites(prev => prev.filter(fav => fav.id !== outletId));
    };

    const toggleFavorite = (outlet: Omit<FavoriteOutlet, 'addedAt'>): void => {
        if (isFavorite(outlet.id)) {
            removeFavorite(outlet.id);
        } else {
            addFavorite(outlet);
        }
    };

    const clearFavorites = (): void => {
        setFavorites([]);
    };

    const getFavoriteCount = (): number => {
        return favorites.length;
    };

    return {
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites,
        getFavoriteCount
    };
}
