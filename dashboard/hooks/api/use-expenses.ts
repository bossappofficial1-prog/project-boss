import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/apis/base";

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    cashier: string;
    outletId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExpenseSummary {
    totalTransaksi: number;
    totalPengeluaran: number;
}

export interface ExpenseListResponse {
    data: Expense[];
    summary: ExpenseSummary;
}

export interface CreateExpensePayload {
    description: string;
    amount: number;
    date: string;
    outletId: string;
    cashier?: string;
}

export interface UpdateExpensePayload {
    description?: string;
    amount?: number;
    date?: string;
    cashier?: string;
}

const EXPENSE_KEYS = {
    all: ["expenses"] as const,
    list: (outletId: string, startDate?: string, endDate?: string) =>
        ["expenses", outletId, startDate, endDate] as const,
};

const fetchExpenses = async (
    outletId: string,
    startDate?: string,
    endDate?: string,
): Promise<ExpenseListResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const qs = params.toString();
    const { data } = await apiClient.get<ApiResponse<ExpenseListResponse>>(
        `/expenses/outlet/${outletId}${qs ? `?${qs}` : ""}`,
    );
    return data.data;
};

const createExpense = async (payload: CreateExpensePayload): Promise<Expense> => {
    const { data } = await apiClient.post<ApiResponse<Expense>>("/expenses", payload);
    return data.data;
};

const updateExpense = async ({
    id,
    ...payload
}: UpdateExpensePayload & { id: string }): Promise<Expense> => {
    const { data } = await apiClient.put<ApiResponse<Expense>>(`/expenses/${id}`, payload);
    return data.data;
};

const deleteExpense = async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
};

export function useExpenseList(
    outletId: string | undefined,
    startDate?: string,
    endDate?: string,
) {
    return useQuery({
        queryKey: EXPENSE_KEYS.list(outletId ?? "", startDate, endDate),
        queryFn: () => fetchExpenses(outletId!, startDate, endDate),
        enabled: Boolean(outletId),
    });
}

export function useCreateExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createExpense,
        onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
    });
}

export function useUpdateExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateExpense,
        onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
    });
}

export function useDeleteExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSE_KEYS.all }),
    });
}
