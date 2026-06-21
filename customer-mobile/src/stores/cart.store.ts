import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CartItem, CartState, SelectedSchedule } from "@/features/cart";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (outletId, outletName, slug, product, quantity = 1, selectedSchedule?) => {
        const { items } = get();
        const slotInfo = selectedSchedule?.slot;
        const staffInfo = selectedSchedule?.staff;

        // SERVICE: only 1 service per outlet
        if (product.type === "SERVICE") {
          const existingService = items.find(
            (item) =>
              item.type === "SERVICE" &&
              item.outletId === outletId &&
              item.productId !== product.id,
          );
          if (existingService) {
            return false;
          }
        }

        // No mixing GOODS/TICKET with SERVICE in same outlet
        const existingItemsInOutlet = items.filter(
          (item) => item.outletId === outletId,
        );
        if (existingItemsInOutlet.length > 0) {
          const hasService = existingItemsInOutlet.some(
            (item) => item.type === "SERVICE",
          );
          const isAddingService = product.type === "SERVICE";
          if (
            (hasService && !isAddingService) ||
            (!hasService && isAddingService)
          ) {
            return false;
          }
        }

        // Time conflict check for SERVICE
        if (product.type === "SERVICE" && slotInfo) {
          const conflict = get().checkTimeConflict(outletId, {
            startTime: slotInfo.startTime,
            endTime: slotInfo.endTime,
            date: slotInfo.date,
          });
          if (conflict) {
            return false;
          }
        }

        const existingIndex = items.findIndex(
          (item) =>
            item.productId === product.id && item.outletId === outletId,
        );

        if (existingIndex >= 0) {
          const existing = items[existingIndex];
          const updated = [...items];

          if (product.type === "SERVICE") {
            // Update slot, not quantity
            updated[existingIndex] = {
              ...existing,
              selectedSlot: slotInfo?.id,
              slotStartTime: slotInfo?.startTime,
              slotEndTime: slotInfo?.endTime,
              slotDate: slotInfo?.date,
              staffId: staffInfo?.id,
              staffName: staffInfo?.name,
            };
          } else {
            const newQty = existing.quantity + quantity;

            // Stock limit for GOODS
            if (
              product.type === "GOODS" &&
              product.maxQuantity != null &&
              newQty > product.maxQuantity
            ) {
              return false;
            }

            updated[existingIndex] = { ...existing, quantity: newQty };
          }

          set({ items: updated });
          return true;
        }

        // Stock limit for new GOODS
        if (
          product.type === "GOODS" &&
          product.maxQuantity != null &&
          quantity > product.maxQuantity
        ) {
          return false;
        }

        const newItem: CartItem = {
          id: `${outletId}-${product.id}-${Date.now()}`,
          outletId,
          slug,
          outletName,
          productId: product.id,
          name: product.name,
          price: product.price,
          taxPercentage: product.taxPercentage,
          taxName: product.taxName,
          quantity,
          type: product.type,
          image: product.image,
          unit: product.unit,
          maxQuantity: product.maxQuantity,
          serviceDurationMinutes: product.serviceDurationMinutes,
          selectedSlot: product.type === "SERVICE" ? slotInfo?.id : undefined,
          slotStartTime:
            product.type === "SERVICE" ? slotInfo?.startTime : undefined,
          slotEndTime:
            product.type === "SERVICE" ? slotInfo?.endTime : undefined,
          slotDate: product.type === "SERVICE" ? slotInfo?.date : undefined,
          staffId: product.type === "SERVICE" ? staffInfo?.id : undefined,
          staffName: product.type === "SERVICE" ? staffInfo?.name : undefined,
        };

        set({ items: [...items, newItem] });
        return true;
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity:
                    item.type === "GOODS" && item.maxQuantity != null
                      ? Math.min(quantity, item.maxQuantity)
                      : quantity,
                }
              : item,
          ),
        });
      },

      updateItem: (itemId, updates) => {
        set({
          items: get().items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      clearOutletItems: (outletId) => {
        set({
          items: get().items.filter((item) => item.outletId !== outletId),
        });
      },

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),

      getOutletItems: (outletId) =>
        get().items.filter((item) => item.outletId === outletId),

      getItemById: (itemId) =>
        get().items.find((item) => item.id === itemId),

      getServiceInCart: (productId, outletId) =>
        get().items.find(
          (item) =>
            item.productId === productId &&
            item.outletId === outletId &&
            item.type === "SERVICE",
        ),

      checkTimeConflict: (outletId, newSlot) => {
        const timeToMinutes = (timeStr: string): number => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const newStartMinutes = timeToMinutes(newSlot.startTime);
        const newEndMinutes = timeToMinutes(newSlot.endTime);

        const servicesInOutlet = get().items.filter(
          (item) =>
            item.outletId === outletId &&
            item.type === "SERVICE" &&
            item.selectedSlot &&
            item.slotDate === newSlot.date,
        );

        for (const service of servicesInOutlet) {
          if (service.slotStartTime && service.slotEndTime) {
            const existingStartMinutes = timeToMinutes(service.slotStartTime);
            const existingEndMinutes = timeToMinutes(service.slotEndTime);

            const hasConflict =
              (newStartMinutes >= existingStartMinutes &&
                newStartMinutes < existingEndMinutes) ||
              (newEndMinutes > existingStartMinutes &&
                newEndMinutes <= existingEndMinutes) ||
              (newStartMinutes <= existingStartMinutes &&
                newEndMinutes >= existingEndMinutes);

            if (hasConflict) return service;
          }
        }

        return undefined;
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
