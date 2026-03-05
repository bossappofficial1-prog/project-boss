import { PaginatedResponse } from "@/types";
import { apiClient } from "./base";

export const stockApi = {
  getByOutlet: (
    outletId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: "GOODS" | "SERVICE";
      status?: "ACTIVE" | "INACTIVE";
    },
  ): Promise<
    PaginatedResponse<{
      id: string;
      name: string;
      type: "GOODS" | "SERVICE";
      quantity?: number;
      unit?: string;
      price: number;
      status: "ACTIVE" | "INACTIVE";
      image?: string;
      goods?: {
        id: string;
        currentStock: number;
        minStock?: number | null;
        maxStock?: number | null;
        unit: string;
        averageHpp: number;
        sellingPrice: number;
      };
    }>
  > => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("q", params.search);
    if (params?.type) searchParams.append("type", params.type);
    if (params?.status) searchParams.append("status", params.status);
    const qs = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${qs ? `?${qs}` : ""}`;
    return apiClient.get(endpoint).then((res) => res.data);
  },

  bulkIn: async (
    data: Array<{
      productGoodsId: string;
      quantity: number;
      hppPerUnit: number;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
      faktur?: string;
    }>,
  ) => {
    console.log("[Stock API] bulkIn Payload:", JSON.stringify(data, null, 2));
    const response = await apiClient.post("/stock/in-bulk", data);
    console.log("[Stock API] bulkIn Response:", JSON.stringify(response.data, null, 2));
    return response.data;
  },

  bulkReturn: async (
    data: Array<{
      productGoodsId: string;
      quantity: number;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
      faktur?: string;
    }>,
  ) => {
    console.log("[Stock API] bulkReturn Payload:", JSON.stringify(data, null, 2));
    const response = await apiClient.post("/stock/return-bulk", data);
    console.log("[Stock API] bulkReturn Response:", JSON.stringify(response.data, null, 2));
    return response.data;
  },

  updateStock: (
    productId: string,
    stockData: {
      quantity: number;
      adjustment?: "add" | "remove" | "set";
      adjustmentQuantity?: number;
      reason?: string;
      notes?: string;
    },
  ) => apiClient.patch(`/products/${productId}/stock`, stockData).then((res) => res.data.data),

  getHistory: (
    productGoodsId: string,
    params?: {
      type?: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    success: boolean;
    data: {
      productGoods: {
        id: string;
        productId: string;
        currentStock: number;
        minStock: number | null;
        unit: string;
        averageHpp: number;
        sellingPrice: number;
        product: {
          id: string;
          name: string;
          description: string | null;
          type: string;
          status: string;
          image: string | null;
        };
      };
      logs: Array<{
        id: string;
        type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
        quantity: number;
        hppPerUnit: number | null;
        referenceType: string | null;
        referenceId: string | null;
        notes: string | null;
        faktur: string | null;
        createdAt: string;
      }>;
      total: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    const qs = searchParams.toString();
    return apiClient
      .get(`/stock/history/${productGoodsId}${qs ? `?${qs}` : ""}`)
      .then((res) => res.data);
  },

  getOverview: (outletId: string): Promise<{
    success: boolean;
    data: {
      totalProducts: number;
      totalStockValue: number;
      lowStockCount: number;
      outOfStockCount: number;
      recentMovements: Record<string, { count: number; totalQty: number }>;
    };
  }> => apiClient.get(`/stock/overview/${outletId}`).then((res) => res.data),

  exportExcel: async (outletId: string): Promise<Blob> => {
    const response = await apiClient.get(`/stock/export/${outletId}`, {
      responseType: "blob",
    });
    return response.data;
  },
};
