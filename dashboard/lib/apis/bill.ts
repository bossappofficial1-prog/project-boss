import { apiCall } from "./base";
import type { OutletTable } from "./table";

export type BillStatus = "OPEN" | "BILLED" | "PAID";

export interface BillOrderItem {
  id: string;
  quantity: number;
  priceAtTimeOfOrder: number;
  productId: string;
  product: {
    id: string;
    name: string;
    type: string;
  };
}

export interface BillOrder {
  id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  guestCustomer?: {
    id: string;
    name: string;
    phone: string;
  };
  items: BillOrderItem[];
}

export interface Bill {
  id: string;
  outletId: string;
  tableId: string;
  status: BillStatus;
  total: number;
  createdAt: string;
  closedAt: string | null;
  updatedAt: string;
  table: OutletTable;
  orders: BillOrder[];
}

export interface CreateBillRequest {
  outletId: string;
  tableId: string;
}

export const billApi = {
  async createBill(payload: CreateBillRequest): Promise<Bill> {
    return apiCall<Bill>("/bills", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getBills(outletId: string, status?: BillStatus): Promise<Bill[]> {
    const params = new URLSearchParams({ outletId });
    if (status) params.append("status", status);
    return apiCall<Bill[]>(`/bills?${params}`);
  },

  async getBill(id: string): Promise<Bill> {
    return apiCall<Bill>(`/bills/${id}`);
  },

  async payBill(id: string): Promise<Bill> {
    return apiCall<Bill>(`/bills/${id}/pay`, {
      method: "PUT",
    });
  },
};