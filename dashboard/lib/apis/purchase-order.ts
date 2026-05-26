import { apiClient } from "./base";

export type PurchaseOrderStatus = "DRAFT" | "SENT" | "COMPLETED" | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productGoodsId?: string | null;
  ingredientId?: string | null;
  quantity: number;
  priceAtOrder: number;
  productGoods?: {
    id: string;
    unit: string;
    product: {
      id: string;
      name: string;
      image?: string | null;
    };
  } | null;
  ingredient?: {
    id: string;
    name: string;
    purchaseUnit: string;
    recipeUnit: string;
  } | null;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  outletId: string;
  status: PurchaseOrderStatus;
  notes?: string | null;
  totalEstimate: number;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  outlet: {
    id: string;
    name: string;
  };
  items: PurchaseOrderItem[];
}

export interface POListResponse {
  success: boolean;
  data: PurchaseOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const purchaseOrderApi = {
  list: async (params: {
    outletId: string;
    status?: PurchaseOrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<POListResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append("outletId", params.outletId);
    if (params.status) searchParams.append("status", params.status);
    if (params.search) searchParams.append("search", params.search);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const { data } = await apiClient.get(
      `/purchase-orders?${searchParams.toString()}`
    );
    return data;
  },

  getById: async (
    id: string
  ): Promise<{ success: boolean; data: PurchaseOrder }> => {
    const { data } = await apiClient.get(`/purchase-orders/${id}`);
    return data;
  },

  updateDraftItems: async (
    id: string,
    payload: {
      notes?: string;
      items: Array<{
        productGoodsId?: string;
        ingredientId?: string;
        quantity: number;
        priceAtOrder: number;
      }>;
    }
  ): Promise<{ success: boolean; data: PurchaseOrder }> => {
    const { data } = await apiClient.put(`/purchase-orders/${id}/items`, payload);
    return data;
  },

  sendPO: async (id: string): Promise<{ success: boolean; data: PurchaseOrder }> => {
    const { data } = await apiClient.post(`/purchase-orders/${id}/send`);
    return data;
  },

  completePO: async (id: string): Promise<{ success: boolean; data: PurchaseOrder }> => {
    const { data } = await apiClient.post(`/purchase-orders/${id}/complete`);
    return data;
  },
};
