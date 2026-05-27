import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2OrderRequest } from "@/lib/apis/pos-v2";
import { toast } from "sonner";

const KEYS = {
    products: (outletId: string) => ["pos-v2", "products", outletId] as const,
    cashSummary: (outletId: string) => ["pos-v2", "cash-summary", outletId] as const,
    recentOrders: (outletId: string) => ["pos-v2", "recent-orders", outletId] as const,
    bookingSlots: (productId: string, date: string) => ["pos-v2", "booking-slots", productId, date] as const,
    availableStaff: (productId: string, slotId: string) => ["pos-v2", "available-staff", productId, slotId] as const,
    outletQris: (outletId: string) => ["pos-v2", "outlet-qris", outletId] as const,
    openOrders: (outletId: string) => ["pos-v2", "open-orders", outletId] as const,
};

const OFFLINE_ORDERS_KEY = "boss_offline_orders_v2";

export function getOfflineOrders(): any[] {
    if (typeof window === "undefined") return [];
    try {
        const data = localStorage.getItem(OFFLINE_ORDERS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveOfflineOrder(order: any) {
    if (typeof window === "undefined") return;
    try {
        const orders = getOfflineOrders();
        orders.push({
            ...order,
            offlineId: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
        console.error("Gagal menyimpan transaksi offline:", e);
    }
}

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

export function usePosV2OpenOrders(outletId: string) {
    return useQuery({
        queryKey: KEYS.openOrders(outletId),
        queryFn: () => posV2Api.getOpenOrders(outletId),
        enabled: !!outletId,
        staleTime: 10_000,
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
        mutationFn: async (data: PosV2OrderRequest) => {
            const isOffline = typeof window !== "undefined" && !navigator.onLine;
            
            if (isOffline) {
                const offlineId = `offline-${Date.now()}`;
                saveOfflineOrder(data);
                return {
                    orderId: offlineId,
                    totalAmount: 0,
                    itemCount: data.items.length,
                    cashReceived: data.cashReceived || 0,
                    change: 0,
                    customerName: data.customer?.name || "Walk-in",
                    createdAt: new Date().toISOString(),
                    hasTickets: false,
                    isOffline: true,
                } as any;
            }

            try {
                return await posV2Api.createOrder(data);
            } catch (err: any) {
                console.warn("Koneksi gagal saat kirim pesanan, menyimpan secara offline:", err);
                const offlineId = `offline-${Date.now()}`;
                saveOfflineOrder(data);
                return {
                    orderId: offlineId,
                    totalAmount: 0,
                    itemCount: data.items.length,
                    cashReceived: data.cashReceived || 0,
                    change: 0,
                    customerName: data.customer?.name || "Walk-in",
                    createdAt: new Date().toISOString(),
                    hasTickets: false,
                    isOffline: true,
                } as any;
            }
        },
        onSuccess: (data: any, variables) => {
            if (data.isOffline) {
                toast.warning("Koneksi internet bermasalah! Transaksi disimpan secara lokal di browser dan akan disinkronkan otomatis saat online kembali. 📡");
            } else {
                toast.success("Transaksi berhasil!");
            }
            
            queryClient.invalidateQueries({
                queryKey: KEYS.products(variables.outletId),
            });
            queryClient.invalidateQueries({
                queryKey: KEYS.cashSummary(variables.outletId),
            });
            queryClient.invalidateQueries({
                queryKey: KEYS.recentOrders(variables.outletId),
            });
            queryClient.invalidateQueries({
                queryKey: KEYS.openOrders(variables.outletId),
            });
        },
    });
}
