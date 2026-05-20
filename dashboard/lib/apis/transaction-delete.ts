import { apiCall } from "./base";

export interface TransactionDeleteRequest {
  id: string;
  transactionId: string | null;
  orderId: string | null;
  outletId: string;
  requestedBy: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionNote: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    type: string;
  }>;
  totalAmount: number;
  requestedStaff?: {
    id: string;
    name: string;
  };
  transaction?: any;
  order?: any;
}

export const transactionDeleteApi = {
  async getRequests(outletId?: string, status?: string): Promise<TransactionDeleteRequest[]> {
    const params = new URLSearchParams();
    if (outletId) params.append("outletId", outletId);
    if (status) params.append("status", status);
    const query = params.toString();
    return apiCall<TransactionDeleteRequest[]>(`/transaction-deletes${query ? `?${query}` : ""}`);
  },

  async approveRequest(requestId: string): Promise<any> {
    return apiCall<any>(`/transaction-deletes/${requestId}/approve`, {
      method: "POST",
    });
  },

  async rejectRequest(requestId: string, rejectionNote: string): Promise<any> {
    return apiCall<any>(`/transaction-deletes/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionNote }),
    });
  },
};
