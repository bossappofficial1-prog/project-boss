import { apiCall, apiClient } from "./base";

export type GoodsOrderStatus =
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "CONFIRMED"
  | "READY"
  | "ON_GOING"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItemEntry {
  productName: string;
  quantity: number;
  price: number;
  productType: "TICKET" | "GOODS" | "SERVICE";
  duration: number | null;
  createdAt: string;
}

export interface OrderV2Entry {
  id: string;
  orderStatus: GoodsOrderStatus;
  totalAmount: number;
  discountAmount: number;
  customerName: string;
  customerPhone: string | null;
  items: OrderItemEntry[];
  paymentMethod: string | null;
  isManualPayment: boolean;
  paymentProofUrl: string | null;
  paymentStatus: string | null;
  createdAt: string;
  updatedAt: string;
  cancellationReason: string | null;
  tableId: string | null;
  tableNumber: string | null;
  staffName: string | null;
}

export interface OrdersV2Board {
  pending: OrderV2Entry[];
  processing: OrderV2Entry[];
  ready: OrderV2Entry[];
  completed: OrderV2Entry[];
}

export interface OrdersV2Stats {
  totalActive: number;
  pendingCount: number;
  processingCount: number;
  readyCount: number;
  completedToday: number;
  cancelledToday: number;
  revenueToday: number;
}

export interface OrdersV2BoardResponse {
  board: OrdersV2Board;
  stats: OrdersV2Stats;
}

export const ordersV2Api = {
  async getBoard(outletId: string, q?: string, dateStr?: string): Promise<OrdersV2BoardResponse> {
    return apiCall<OrdersV2BoardResponse>(
      `/orders/v2/${outletId}/board?q=${q || ""}&date=${dateStr || ""}`,
    );
  },

  async updateStatus(orderId: string, status: GoodsOrderStatus, reason?: string): Promise<any> {
    return apiCall<any>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    });
  },

  async getReceipt(orderId: string): Promise<Blob> {
    const response = await apiClient.get(`/orders/${orderId}/receipt`, {
      responseType: "blob",
    });
    return response.data;
  },

  async printOrderTickets(orderId: string): Promise<Blob> {
    const response = await apiClient.get(`/tickets/order/${orderId}/print`, {
      responseType: "blob",
    });
    return response.data;
  },
};
