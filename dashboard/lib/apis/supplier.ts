import { apiClient } from "./base";

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  outletId: string;
  createdAt: string;
  updatedAt: string;
  products?: SupplierProductLink[];
  _count?: { products: number };
}

export interface SupplierProductLink {
  id: string;
  supplierId: string;
  productGoodsId: string;
  lastPrice?: number | null;
  lastOrderDate?: string | null;
  notes?: string | null;
  productGoods: {
    id: string;
    product: {
      id: string;
      name: string;
      image?: string | null;
    };
  };
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  outletId: string;
  productGoodsIds?: string[];
}

export interface UpdateSupplierPayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  productGoodsIds?: string[];
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const supplierApi = {
  list: async (params: {
    outletId: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SupplierListResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append("outletId", params.outletId);
    if (params.search) searchParams.append("search", params.search);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    const { data } = await apiClient.get(
      `/suppliers?${searchParams.toString()}`,
    );
    return data;
  },

  getById: async (
    id: string,
  ): Promise<{ success: boolean; data: Supplier }> => {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data;
  },

  create: async (
    payload: CreateSupplierPayload,
  ): Promise<{ success: boolean; data: Supplier }> => {
    const { data } = await apiClient.post("/suppliers", payload);
    return data;
  },

  update: async (
    id: string,
    payload: UpdateSupplierPayload,
  ): Promise<{ success: boolean; data: Supplier }> => {
    const { data } = await apiClient.put(`/suppliers/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(`/suppliers/${id}`);
    return data;
  },

  getByProduct: async (
    productGoodsId: string,
  ): Promise<{ success: boolean; data: any[] }> => {
    const { data } = await apiClient.get(
      `/suppliers/by-product/${productGoodsId}`,
    );
    return data;
  },
};
