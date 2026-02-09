import { apiCall, apiClient } from "./base";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string
  outletId: string;
  cashier?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  date: string; // ISO datetime string
  outletId: string;
  cashier?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  date?: string; // ISO datetime string
  outletId?: string;
  cashier?: string;
}

export interface ExpenseListResult {
  data: Expense[];
  summary: { totalTransaksi: number; totalPengeluaran: number };
}

export const expenseApi = {
  async create(data: CreateExpenseRequest): Promise<Expense> {
    return apiCall<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listByOutlet(
    outletId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<ExpenseListResult> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    const qs = searchParams.toString();
    return apiCall<ExpenseListResult>(`/expenses/outlet/${outletId}${qs ? `?${qs}` : ""}`);
  },

  async update(id: string, data: UpdateExpenseRequest): Promise<Expense> {
    return apiCall<Expense>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string): Promise<null> {
    // Use apiClient to handle 204 No Content responses gracefully
    await apiClient.delete(`/expenses/${id}`);
    return null;
  },
};

export default expenseApi;
