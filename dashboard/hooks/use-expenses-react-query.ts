import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apis/base';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO string
    outletId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExpenseFilters {
    page?: number;
    limit?: number;
    outletId?: string;
    startDate?: string;
    endDate?: string;
}

export interface CreateExpenseData {
    description: string;
    amount: number;
    date: string; // ISO datetime string
    outletId: string;
}

export interface UpdateExpenseData {
    description?: string;
    amount?: number;
    date?: string;
}

// Query hooks
export const useExpenses = (filters?: ExpenseFilters) => {
    return useQuery({
        queryKey: ['expenses', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.outletId) params.append('outletId', filters.outletId);
            if (filters?.startDate) params.append('startDate', filters.startDate);
            if (filters?.endDate) params.append('endDate', filters.endDate);

            const queryString = params.toString();
            const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get(endpoint);
            return response.data.data;
        },
    });
};

export const useExpense = (expenseId: string) => {
    return useQuery({
        queryKey: ['expense', expenseId],
        queryFn: async () => {
            const response = await apiClient.get(`/expenses/${expenseId}`);
            return response.data.data;
        },
        enabled: !!expenseId,
    });
};

// Mutation hooks
export const useCreateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (expenseData: CreateExpenseData) => {
            const response = await apiClient.post('/expenses', expenseData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate expenses list
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ expenseId, expenseData }: { expenseId: string; expenseData: UpdateExpenseData }) => {
            const response = await apiClient.patch(`/expenses/${expenseId}`, expenseData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate expense detail and expenses list
            queryClient.invalidateQueries({ queryKey: ['expense', data.id] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (expenseId: string) => {
            await apiClient.delete(`/expenses/${expenseId}`);
            return expenseId;
        },
        onSuccess: () => {
            // Invalidate expenses list
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};