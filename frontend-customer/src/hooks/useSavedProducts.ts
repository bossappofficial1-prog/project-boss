'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface SavedProduct {
    id: string;
    savedAt: string;
}

const STORAGE_KEY = 'saved-products';

export function useSavedProducts() {
    const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved products from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSavedProducts(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error('Error loading saved products:', error);
            setSavedProducts([]);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage whenever savedProducts changes
    const saveToStorage = useCallback((products: SavedProduct[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        } catch (error) {
            console.error('Error saving products:', error);
        }
    }, []);

    // Add product to saved list
    const saveProduct = useCallback((productId: string) => {
        setSavedProducts(prev => {
            const exists = prev.some(p => p.id === productId);
            if (exists) return prev;

            const newProduct: SavedProduct = {
                id: productId,
                savedAt: new Date().toISOString()
            };
            const updated = [...prev, newProduct];
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    // Remove product from saved list
    const unsaveProduct = useCallback((productId: string) => {
        setSavedProducts(prev => {
            const updated = prev.filter(p => p.id !== productId);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    // Toggle save/unsave
    const toggleSaveProduct = useCallback((productId: string) => {
        setSavedProducts(prev => {
            const isSaved = prev.some(p => p.id === productId);
            if (isSaved) {
                // Remove product
                const updated = prev.filter(p => p.id !== productId);
                saveToStorage(updated);
                return updated;
            } else {
                // Add product
                const newProduct: SavedProduct = {
                    id: productId,
                    savedAt: new Date().toISOString()
                };
                const updated = [...prev, newProduct];
                saveToStorage(updated);
                return updated;
            }
        });
    }, [saveToStorage]);

    // Check if product is saved
    const isProductSaved = useCallback((productId: string) => {
        return savedProducts.some(p => p.id === productId);
    }, [savedProducts]);

    // Get saved products count
    const savedProductsCount = savedProducts.length;

    // Get saved product IDs with memoization to prevent unnecessary re-renders
    const savedProductIds = useMemo(() => savedProducts.map(p => p.id), [savedProducts]);

    // Clear all saved products
    const clearSavedProducts = useCallback(() => {
        setSavedProducts([]);
        saveToStorage([]);
    }, [saveToStorage]);

    return {
        savedProducts,
        savedProductsCount,
        savedProductIds,
        isLoaded,
        saveProduct,
        unsaveProduct,
        toggleSaveProduct,
        isProductSaved,
        clearSavedProducts
    };
}