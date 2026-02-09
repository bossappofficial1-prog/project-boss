import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";
import { stockApi } from "@/lib/apis/stock";
import { uploadApi } from "@/lib/apis/upload";

// Types
export interface POBProduct {
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
    type: "GOODS" | "SERVICE";
    status: "ACTIVE" | "INACTIVE";
    goods?: {
        id: string;
        currentStock: number;
        minStock?: number | null;
        unit: string;
        averageHpp: number;
        sellingPrice: number;
    } | null;
}

export interface POBCartItem {
    product: POBProduct;
    quantity: number;
    hppPerUnit: number;
}

export interface StockInPayload {
    productGoodsId: string;
    quantity: number;
    hppPerUnit: number;
    notes?: string;
    referenceType?: string;
    referenceId?: string;
    faktur?: string;
}

export interface StockReturnPayload {
    productGoodsId: string;
    quantity: number;
    notes?: string;
    referenceType?: string;
    referenceId?: string;
    faktur?: string;
}

export interface StockHistoryLog {
    id: string;
    type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
    quantity: number;
    hppPerUnit: number | null;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    faktur: string | null;
    createdAt: string;
}

// Query keys
const KEYS = {
    products: (outletId: string) => ["pob-v2", "products", outletId] as const,
    history: (productGoodsId: string) => ["pob-v2", "history", productGoodsId] as const,
};

// Fetch GOODS products for outlet
const fetchProducts = async (outletId: string, search?: string): Promise<POBProduct[]> => {
    const params = new URLSearchParams();
    params.append("limit", "200");
    params.append("type", "GOODS");
    params.append("status", "ACTIVE");
    params.append("accessed", "CASHIER");
    if (search?.trim()) params.append("q", search.trim());

    const { data } = await apiClient.get(`/products/outlet/${outletId}?${params.toString()}`);
    return data.data ?? [];
};

// Hooks
export function usePOBProducts(outletId: string, search?: string) {
    return useQuery({
        queryKey: [...KEYS.products(outletId), search],
        queryFn: () => fetchProducts(outletId, search),
        enabled: !!outletId,
        staleTime: 30_000,
    });
}

export function usePOBStockHistory(productGoodsId: string | null) {
    return useQuery({
        queryKey: KEYS.history(productGoodsId ?? ""),
        queryFn: () => stockApi.getHistory(productGoodsId!, { limit: 10 }),
        enabled: !!productGoodsId,
        staleTime: 15_000,
        select: (res) => res.data,
    });
}

export function usePOBStockIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StockInPayload[]) => stockApi.bulkIn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pob-v2", "products"] });
        },
    });
}

export function usePOBStockReturn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: StockReturnPayload[]) => stockApi.bulkReturn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pob-v2", "products"] });
        },
    });
}

export function usePOBUploadFaktur() {
    return useMutation({
        mutationFn: (file: File) => uploadApi.uploadImage(file),
    });
}
