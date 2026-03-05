import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2OrderRequest } from "@/lib/apis/pos-v2";

const KEYS = {
    products: (outletId: string) => ["pos-v2", "products", outletId] as const,
    cashSummary: (outletId: string) => ["pos-v2", "cash-summary", outletId] as const,
    recentOrders: (outletId: string) => ["pos-v2", "recent-orders", outletId] as const,
    bookingSlots: (productId: string, date: string) => ["pos-v2", "booking-slots", productId, date] as const,
    availableStaff: (productId: string, slotId: string) => ["pos-v2", "available-staff", productId, slotId] as const,
    outletQris: (outletId: string) => ["pos-v2", "outlet-qris", outletId] as const,
};

export function usePosV2Products(outletId: string, search?: string) {
    return useQuery({
        queryKey: [...KEYS.products(outletId), search],
        queryFn: () => posV2Api.getProducts(outletId, search),
        enabled: !!outletId,
        staleTime: 30_000,
    });
}

export function usePosV2CashSummary(outletId: string) {
    return useQuery({
        queryKey: KEYS.cashSummary(outletId),
        queryFn: () => posV2Api.getCashSummary(outletId),
        enabled: !!outletId,
        refetchInterval: 60_000,
    });
}

export function usePosV2RecentOrders(outletId: string) {
    return useQuery({
        queryKey: KEYS.recentOrders(outletId),
        queryFn: () => posV2Api.getRecentOrders(outletId),
        enabled: !!outletId,
        staleTime: 15_000,
    });
}

export function usePosV2BookingSlots(productId: string, date: string) {
    return useQuery({
        queryKey: KEYS.bookingSlots(productId, date),
        queryFn: () => posV2Api.getBookingSlots(productId, date),
        enabled: !!productId && !!date,
        staleTime: 30_000,
    });
}

export function usePosV2AvailableStaff(productId: string, slotId: string) {
    return useQuery({
        queryKey: KEYS.availableStaff(productId, slotId),
        queryFn: () => posV2Api.getAvailableStaff(productId, slotId),
        enabled: !!productId && !!slotId,
    });
}

export function usePosV2OutletQris(outletId: string) {
    return useQuery({
        queryKey: KEYS.outletQris(outletId),
        queryFn: () => posV2Api.getOutletQris(outletId),
        enabled: !!outletId,
        staleTime: 5 * 60_000,
    });
}

export function usePosV2CreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PosV2OrderRequest) => posV2Api.createOrder(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: KEYS.products(variables.outletId),
            });
            queryClient.invalidateQueries({
                queryKey: KEYS.cashSummary(variables.outletId),
            });
            queryClient.invalidateQueries({
                queryKey: KEYS.recentOrders(variables.outletId),
            });
        },
    });
}
