import { ApiResponse, PaginatedResponse } from "@/types";
import { apiClient } from "./base";

export interface StockTransferItem {
  id: string;
  stockTransferId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    image?: string;
    goods?: {
      id: string;
      currentStock: number;
      unit: string;
      sellingPrice: number;
      averageHpp: number;
      sku?: string;
      barcode?: string;
    };
  };
}

export interface StockTransfer {
  id: string;
  businessId: string;
  senderOutletId: string;
  receiverOutletId: string;
  status: "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
  shippingDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  senderOutlet: {
    id: string;
    name: string;
  };
  receiverOutlet: {
    id: string;
    name: string;
  };
  items: StockTransferItem[];
}

export const stockTransferApi = {
  create: (data: {
    senderOutletId: string;
    receiverOutletId: string;
    shippingDate: string;
    note?: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<ApiResponse<StockTransfer>> => {
    return apiClient.post("/stock-transfers", data).then((res) => res.data);
  },

  getById: (id: string): Promise<ApiResponse<StockTransfer>> => {
    return apiClient.get(`/stock-transfers/${id}`).then((res) => res.data);
  },

  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    senderOutletId?: string;
    receiverOutletId?: string;
    search?: string;
  }): Promise<PaginatedResponse<StockTransfer>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);
    if (params?.senderOutletId) searchParams.append("senderOutletId", params.senderOutletId);
    if (params?.receiverOutletId) searchParams.append("receiverOutletId", params.receiverOutletId);
    if (params?.search) searchParams.append("search", params.search);

    const qs = searchParams.toString();
    return apiClient.get(`/stock-transfers${qs ? `?${qs}` : ""}`).then((res) => res.data);
  },

  updateStatus: (
    id: string,
    status: "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED"
  ): Promise<ApiResponse<StockTransfer>> => {
    return apiClient.patch(`/stock-transfers/${id}/status`, { status }).then((res) => res.data);
  },
};
