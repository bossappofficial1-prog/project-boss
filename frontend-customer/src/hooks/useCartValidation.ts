"use client";

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';
import { useCart } from './useCart';
import { CartValidationService, CartValidationResult } from '@/services/cart-validation';
import { useToast } from '@/components/ui/toast';

interface UseCartValidationOptions {
    enabled?: boolean;
    refetchInterval?: number;
    onInvalidItemsFound?: (invalidItems: CartValidationResult['invalidItems']) => void;
    autoRemoveInvalid?: boolean;
}

export function useCartValidation(options: UseCartValidationOptions = {}) {
    const {
        enabled = true,
        refetchInterval = 5 * 60 * 1000, // 5 menit
        onInvalidItemsFound,
        autoRemoveInvalid = false
    } = options;

    const { items, removeItem } = useCart();
    const { push: toast } = useToast();

    // Prepare data untuk validasi
    const cartItemsForValidation = useMemo(() =>
        items.map(item => ({
            id: item.id,
            slug: item.slug,
            productId: item.productId,
            name: item.name,
            outletName: item.outletName
        })), [items]
    );

    // Query untuk validasi cart
    const {
        data: validationResult,
        isLoading: isValidating,
        isError,
        error,
        refetch: revalidate
    } = useQuery<CartValidationResult>({
        queryKey: ['cart-validation', cartItemsForValidation.map(i => `${i.slug}-${i.productId}`).sort()],
        queryFn: () => CartValidationService.validateCartWithRetry(cartItemsForValidation),
        enabled: enabled && cartItemsForValidation.length > 0,
        staleTime: 2 * 60 * 1000, // 2 menit
        refetchInterval,
    });

    // Handle validation results with useEffect
    useEffect(() => {
        if (!validationResult) return;

        // Panggil callback jika ada item invalid
        if (validationResult.invalidItems.length > 0 && onInvalidItemsFound) {
            onInvalidItemsFound(validationResult.invalidItems);
        }

        // Auto remove invalid items jika diaktifkan
        if (autoRemoveInvalid && validationResult.invalidItems.length > 0) {
            validationResult.invalidItems.forEach(({ itemId, reason }) => {
                removeItem(itemId);
                toast({
                    title: 'Item Removed',
                    description: reason,
                });
            });
        }
    }, [validationResult, onInvalidItemsFound, autoRemoveInvalid, removeItem, toast]);

    // Manual removal of invalid items
    const removeInvalidItems = useCallback(() => {
        if (!validationResult?.invalidItems) return;

        let removedCount = 0;
        validationResult.invalidItems.forEach(({ itemId }) => {
            removeItem(itemId);
            removedCount++;
        });

        if (removedCount > 0) {
            toast({
                title: 'Items Removed',
                description: `${removedCount} unavailable item${removedCount > 1 ? 's' : ''} removed from cart`,
            });
        }
    }, [validationResult, removeItem, toast]);

    // Helper functions
    const hasInvalidItems = validationResult?.invalidItems.length! > 0;
    const isAllValid = validationResult ? validationResult.invalidItems.length === 0 : true;
    const invalidItemsCount = validationResult?.invalidItems.length || 0;
    const validItemsCount = validationResult?.validItems.length || items.length;

    // Get invalid items by type
    const invalidOutlets = useMemo(() =>
        validationResult?.invalidItems.filter(item => item.type === 'outlet') || [],
        [validationResult]
    );

    const invalidProducts = useMemo(() =>
        validationResult?.invalidItems.filter(item => item.type === 'product') || [],
        [validationResult]
    );

    // Get summary info
    const validationSummary = useMemo(() => {
        if (!validationResult) return null;

        return {
            ...validationResult.summary,
            hasInvalidItems,
            isAllValid,
            invalidOutletsCount: invalidOutlets.length,
            invalidProductsCount: invalidProducts.length
        };
    }, [validationResult, hasInvalidItems, isAllValid, invalidOutlets.length, invalidProducts.length]);

    return {
        // Data
        validationResult,
        validationSummary,

        // State
        isValidating,
        isError,
        error,
        hasInvalidItems,
        isAllValid,
        invalidItemsCount,
        validItemsCount,

        // Invalid items by type
        invalidOutlets,
        invalidProducts,

        // Actions
        revalidate,
        removeInvalidItems,

        // Helper untuk mendapatkan status validasi item tertentu
        isItemValid: useCallback((itemId: string) => {
            if (!validationResult) return true; // Assume valid jika belum ada hasil validasi
            return validationResult.validItems.includes(itemId);
        }, [validationResult]),

        // Helper untuk mendapatkan alasan item invalid
        getInvalidReason: useCallback((itemId: string) => {
            if (!validationResult) return null;
            const invalidItem = validationResult.invalidItems.find(item => item.itemId === itemId);
            return invalidItem?.reason || null;
        }, [validationResult])
    };
}
