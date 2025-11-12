"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductType } from '@/types';
import { SelectedSchedule } from '@/types/booking-slots';

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
    selectedSlot?: string; // For SERVICES with booking slots (slot ID)
    slotStartTime?: string; // For time conflict checking
    slotEndTime?: string; // For time conflict checking
    slotDate?: string; // For date-specific conflict checking
    staffId?: string;
    staffName?: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (outletId: string, outletName: string, product: ProductType, quantity?: number, selectedSchedule?: SelectedSchedule) => boolean;
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
    getSelectedSlot: (slotId: string) => string;
    getServiceInCart: (productId: string, outletId: string) => CartItem | undefined;
    checkTimeConflict: (outletId: string, newSlot: { startTime: string; endTime: string; date: string }) => CartItem | undefined;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (outletId: string, outletName: string, product: ProductType, quantity = 1, selectedSchedule) => {
                const { items } = get();
                const slotInfo = selectedSchedule?.slot;
                const staffInfo = selectedSchedule?.staff;

                // Validasi: Dalam satu outlet, tidak boleh ada campuran GOODS dan SERVICE
                const existingItemsInOutlet = items.filter(item => item.outletId === outletId);
                if (existingItemsInOutlet.length > 0) {
                    const existingProductTypes = [...new Set(existingItemsInOutlet.map(item => item.type))];
                    if (!existingProductTypes.includes(product.type)) {
                        throw new Error(`Tidak dapat menambahkan ${product.type === 'GOODS' ? 'produk' : 'layanan'} ke outlet yang sudah berisi ${existingProductTypes.includes('GOODS') ? 'produk' : 'layanan'}. Silakan checkout terlebih dahulu atau pilih outlet lain.`);
                    }
                }

                // Check for time conflicts for SERVICE items
                if (product.type === 'SERVICE' && slotInfo) {
                    const conflict = get().checkTimeConflict(outletId, {
                        startTime: slotInfo.startTime,
                        endTime: slotInfo.endTime,
                        date: slotInfo.date
                    });

                    if (conflict) {
                        // Conflict detected - don't add the item
                        console.warn('Time conflict detected with existing service:', conflict);
                        return false; // Return false to indicate failure
                    }
                }

                const existingItemIndex = items.findIndex(
                    item => item.productId === product.id && item.outletId === outletId
                );

                if (existingItemIndex >= 0) {
                    // Update existing item
                    const updatedItems = [...items];
                    const existingItem = updatedItems[existingItemIndex];

                    if (product.type === 'SERVICE') {
                        // For services, update the selected slot instead of quantity
                        updatedItems[existingItemIndex] = {
                            ...existingItem,
                            selectedSlot: slotInfo?.id,
                            slotStartTime: slotInfo?.startTime,
                            slotEndTime: slotInfo?.endTime,
                            slotDate: slotInfo?.date,
                            staffId: staffInfo?.id,
                            staffName: staffInfo?.name
                        };
                    } else {
                        // For goods, update quantity
                        const newQuantity = existingItem.quantity + quantity;

                        // Check max quantity for GOODS
                        if (product.type === 'GOODS' && product.quantity !== null) {
                            if (newQuantity > product.quantity) {
                                // Don't add if exceeds stock
                                return false;
                            }
                        }

                        updatedItems[existingItemIndex] = {
                            ...existingItem,
                            quantity: newQuantity
                        };
                    }

                    set({ items: updatedItems });
                    return true;
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
                        selectedSlot: product.type === 'SERVICE' ? slotInfo?.id : undefined,
                        slotStartTime: product.type === 'SERVICE' ? slotInfo?.startTime : undefined,
                        slotEndTime: product.type === 'SERVICE' ? slotInfo?.endTime : undefined,
                        slotDate: product.type === 'SERVICE' ? slotInfo?.date : undefined,
                        staffId: product.type === 'SERVICE' ? staffInfo?.id : undefined,
                        staffName: product.type === 'SERVICE' ? staffInfo?.name : undefined
                    };

                    set({ items: [...items, newItem] });
                    return true;
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

            getSelectedSlot: (slotId: string) => {
                const { items } = get();
                const found = items.find(item => item.selectedSlot === slotId);
                return found ? found.selectedSlot || '' : '';
            },

            getServiceInCart: (productId: string, outletId: string) => {
                const { items } = get();
                return items.find(item =>
                    item.productId === productId &&
                    item.outletId === outletId &&
                    item.type === 'SERVICE'
                );
            },

            checkTimeConflict: (outletId: string, newSlot: { startTime: string; endTime: string; date: string }) => {
                const { items } = get();

                // Helper function to convert time string to minutes (e.g., "08:00" -> 480)
                const timeToMinutes = (timeStr: string): number => {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    return hours * 60 + minutes;
                };

                const newStartMinutes = timeToMinutes(newSlot.startTime);
                const newEndMinutes = timeToMinutes(newSlot.endTime);

                // Find services in the same outlet on the same date that might conflict
                const servicesInOutlet = items.filter(item =>
                    item.outletId === outletId &&
                    item.type === 'SERVICE' &&
                    item.selectedSlot &&
                    item.slotDate === newSlot.date
                );

                for (const service of servicesInOutlet) {
                    if (service.slotStartTime && service.slotEndTime) {
                        const existingStartMinutes = timeToMinutes(service.slotStartTime);
                        const existingEndMinutes = timeToMinutes(service.slotEndTime);

                        // Check if there's any overlap between the time slots
                        const hasConflict = (
                            (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
                            (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
                            (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
                        );

                        if (hasConflict) {
                            return service; // Return the conflicting service
                        }
                    }
                }

                return undefined; // No conflict found
            },
        }),
        {
            name: 'cart-storage',
            // Only persist items, not UI state
            partialize: (state) => ({ items: state.items }),
        }
    )
);
