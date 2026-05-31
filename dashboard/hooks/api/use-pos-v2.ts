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
        queryFn: async () => {
            const cacheKey = `boss_products_cache_${outletId}`;
            const isOffline = typeof window !== "undefined" && !navigator.onLine;

            if (isOffline) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (search) {
                            const query = search.toLowerCase();
                            const filtered = parsed.products.filter((p: any) => 
                                p.name.toLowerCase().includes(query) || 
                                p.sku?.toLowerCase().includes(query) || 
                                p.barcode?.toLowerCase().includes(query)
                            );
                            return { products: filtered };
                        }
                        return parsed;
                    } catch (e) {
                        console.error("Gagal parse cache produk:", e);
                    }
                }
                return { products: [] };
            }

            try {
                const data = await posV2Api.getProducts(outletId, search);
                // Hanya cache data lengkap (tanpa filter search) agar bisa difilter offline secara akurat
                if (!search) {
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
                return data;
            } catch (err) {
                console.warn("Gagal mengambil produk, menggunakan cache lokal:", err);
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (search) {
                            const query = search.toLowerCase();
                            const filtered = parsed.products.filter((p: any) => 
                                p.name.toLowerCase().includes(query) || 
                                p.sku?.toLowerCase().includes(query) || 
                                p.barcode?.toLowerCase().includes(query)
                            );
                            return { products: filtered };
                        }
                        return parsed;
                    } catch (e) {
                        // ignore
                    }
                }
                throw err;
            }
        },
        enabled: !!outletId,
        staleTime: 30_000,
    });
}

export function usePosV2CashSummary(outletId: string) {
    return useQuery({
        queryKey: KEYS.cashSummary(outletId),
        queryFn: async () => {
            const cacheKey = `boss_cash_summary_cache_${outletId}`;
            const isOffline = typeof window !== "undefined" && !navigator.onLine;

            if (isOffline) {
                const cached = localStorage.getItem(cacheKey);
                return cached ? JSON.parse(cached) : null;
            }

            try {
                const data = await posV2Api.getCashSummary(outletId);
                localStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } catch (err) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
                return null;
            }
        },
        enabled: !!outletId,
        refetchInterval: typeof window !== "undefined" && navigator.onLine ? 60_000 : false,
    });
}

export function usePosV2RecentOrders(outletId: string) {
    return useQuery({
        queryKey: KEYS.recentOrders(outletId),
        queryFn: async () => {
            const cacheKey = `boss_recent_orders_cache_${outletId}`;
            const isOffline = typeof window !== "undefined" && !navigator.onLine;

            if (isOffline) {
                const cached = localStorage.getItem(cacheKey);
                return cached ? JSON.parse(cached) : [];
            }

            try {
                const data = await posV2Api.getRecentOrders(outletId);
                localStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } catch (err) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
                return [];
            }
        },
        enabled: !!outletId,
        staleTime: 15_000,
    });
}

export function usePosV2OpenOrders(outletId: string) {
    return useQuery({
        queryKey: KEYS.openOrders(outletId),
        queryFn: async () => {
            const cacheKey = `boss_open_orders_cache_${outletId}`;
            const isOffline = typeof window !== "undefined" && !navigator.onLine;

            if (isOffline) {
                const cached = localStorage.getItem(cacheKey);
                return cached ? JSON.parse(cached) : [];
            }

            try {
                const data = await posV2Api.getOpenOrders(outletId);
                localStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } catch (err) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
                return [];
            }
        },
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
        queryFn: async () => {
            const cacheKey = `boss_qris_cache_${outletId}`;
            const isOffline = typeof window !== "undefined" && !navigator.onLine;

            if (isOffline) {
                const cached = localStorage.getItem(cacheKey);
                return cached ? JSON.parse(cached) : null;
            }

            try {
                const data = await posV2Api.getOutletQris(outletId);
                localStorage.setItem(cacheKey, JSON.stringify(data));
                return data;
            } catch (err) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
                return null;
            }
        },
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
