// Transaction API - Operasi untuk manajemen transaksi dan pembayaran
import { apiClient, ApiResponse } from "./base";

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE"; // New: transaction type
  orderId?: string; // Optional for expenses
  amount: number;
  status:
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "PROOF_SUBMITTED"
    | "AWAITING_VERIFICATION"
    | "REFUNDED"
    | "EXPIRED"
    | "REJECTED_MANUAL";
  description: string; // New: description for expenses or income
  paymentMethod?: string;
  isManual: boolean;
  manualMethod?: string;
  paymentProofUrl?: string;
  externalId?: string;
  cashier?: string;
  createdAt: string;
  outlet: {
    id: string;
    name: string;
    address: string;
  };
  order?: {
    id: string;
    totalAmount: number;
    taxAmount: number;
    orderStatus: string;
    paymentStatus: string;
    customerType: string;
    midtransFee: number;
    appFee: number;
    discountAmount: number;
    createdAt: string;
    guestCustomer: {
      name: string;
      phone: string;
      email?: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      priceAtTimeOfOrder: number;
      product: {
        name: string;
        price: number;
      };
    }>;
  } | null; // Null for expenses
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: "INCOME" | "EXPENSE" | "ALL"; // New: filter by transaction type
  startDate?: string;
  endDate?: string;
  outletId?: string; // Filter by specific outlet
  q?: string;
}

export interface CreateManualTransactionPayload {
  outletId: string;
  transactionDate: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  items: Array<{
    productId: string;
    quantity: number;
    bookingDate?: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Transaction API
 * Centralized API untuk operasi transaksi
 */
export const transactionApi = {
  /**
   * Mendapatkan daftar transaksi dengan pagination
   */
  getAll: async (
    params?: TransactionListParams,
  ): Promise<
    PaginatedResponse<{
      items: Transaction[];
      totals: {
        total_revenue: number;
        total_expense: number;
        total_margin_pendapatan: number;
      };
    }>
  > => {
    const response = await apiClient.get<
      PaginatedResponse<{
        items: Transaction[];
        totals: {
          total_revenue: number;
          total_expense: number;
          total_margin_pendapatan: number;
        };
      }>
    >("/transactions", {
      params,
    });
    // Extract data and pagination from backend response
    const { data, pagination } = response.data;

    return {
      data: data,
      pagination: pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: 0,
        totalPages: 0,
      },
    };
  },

  /**
   * Mendapatkan detail transaksi berdasarkan ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Menyetujui pembayaran transaksi
   */
  approve: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Transaction>>(`/transactions/${id}/approve`);
    return response.data;
  },

  /**
   * Menolak pembayaran transaksi
   */
  reject: async (id: string, reason?: string) => {
    const response = await apiClient.patch<ApiResponse<Transaction>>(`/transactions/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  /**
   * Update status transaksi
   */
  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<ApiResponse<Transaction>>(`/transactions/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Membuat transaksi manual (owner/manager)
   */
  createManualTransaction: async (payload: CreateManualTransactionPayload) => {
    const response = await apiClient.post<ApiResponse<{ transaction: Transaction; order: any; calculatedAmount: number }>>("/transactions", payload);
    return response.data;
  },
};
