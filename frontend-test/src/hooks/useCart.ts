"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductType } from '@/types';

export interface CartItem {
    id: string;
    outletId: string;
    outletName: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    type: 'GOODS' | 'SERVICE';
    image?: string;
    unit?: string;
    maxQuantity?: number; // For GOODS with limited stock
    serviceDurationMinutes?: number; // For SERVICES
    selectedSlot?: string; // For SERVICES with booking slots
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (outletId: string, outletName: string, product: ProductType, quantity?: number, selectedSlot?: any) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateItem: (itemId: string, updates: Partial<CartItem>) => void;
    clearCart: () => void;
    clearOutletItems: (outletId: string) => void;
    setIsOpen: (isOpen: boolean) => void;

    // Getters
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getOutletItems: (outletId: string) => CartItem[];
    getItemById: (itemId: string) => CartItem | undefined;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (outletId: string, outletName: string, product: ProductType, quantity = 1, selectedSlot) => {
                const { items } = get();
                const existingItemIndex = items.findIndex(
                    item => item.productId === product.id && item.outletId === outletId
                );

                if (existingItemIndex >= 0) {
                    // Update existing item
                    const updatedItems = [...items];
                    const existingItem = updatedItems[existingItemIndex];
                    const newQuantity = existingItem.quantity + quantity;

                    // Check max quantity for GOODS
                    if (product.type === 'GOODS' && product.quantity !== null) {
                        if (newQuantity > product.quantity) {
                            // Don't add if exceeds stock
                            return;
                        }
                    }

                    updatedItems[existingItemIndex] = {
                        ...existingItem,
                        quantity: newQuantity
                    };

                    set({ items: updatedItems });
                } else {
                    // Add new item
                    const newItem: CartItem = {
                        id: `${outletId}-${product.id}-${Date.now()}`,
                        outletId,
                        outletName,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity,
                        type: product.type,
                        image: product.image,
                        unit: product.unit || undefined,
                        maxQuantity: product.type === 'GOODS' ? product.quantity || undefined : undefined,
                        serviceDurationMinutes: product.type === 'SERVICE' ? product.serviceDurationMinutes || undefined : undefined,
                        selectedSlot: product.type === 'SERVICE' ? selectedSlot : undefined
                    };

                    set({ items: [...items, newItem] });
                }
            },

            removeItem: (itemId: string) => {
                const { items } = get();
                set({ items: items.filter(item => item.id !== itemId) });
            },

            updateQuantity: (itemId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }

                const { items } = get();
                const updatedItems = items.map(item => {
                    if (item.id === itemId) {
                        // Check max quantity for GOODS
                        if (item.type === 'GOODS' && item.maxQuantity && quantity > item.maxQuantity) {
                            return { ...item, quantity: item.maxQuantity };
                        }
                        return { ...item, quantity };
                    }
                    return item;
                });

                set({ items: updatedItems });
            },

            updateItem: (itemId: string, updates: Partial<CartItem>) => {
                const { items } = get();
                const updatedItems = items.map(item => {
                    if (item.id === itemId) {
                        return { ...item, ...updates };
                    }
                    return item;
                });
                set({ items: updatedItems });
            },

            clearCart: () => {
                set({ items: [] });
            },

            clearOutletItems: (outletId: string) => {
                const { items } = get();
                set({ items: items.filter(item => item.outletId !== outletId) });
            },

            setIsOpen: (isOpen: boolean) => {
                set({ isOpen });
            },

            getTotalItems: () => {
                const { items } = get();
                return items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                const { items } = get();
                return items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            getOutletItems: (outletId: string) => {
                const { items } = get();
                return items.filter(item => item.outletId === outletId);
            },

            getItemById: (itemId: string) => {
                const { items } = get();
                return items.find(item => item.id === itemId);
            },
        }),
        {
            name: 'cart-storage',
            // Only persist items, not UI state
            partialize: (state) => ({ items: state.items }),
        }
    )
);
