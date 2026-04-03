import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apis/base';
import { orderApi } from '@/lib/apis/order';

export interface Order {
    id: string;
    customerName: string | null;
    customerPhone: string | null;
    orderStatus: 'AWAITING_PAYMENT' | 'PROCESSING' | 'CONFIRMED' | 'READY' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PROOF_SUBMITTED' | 'AWAITING_VERIFICATION' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED_MANUAL';
    totalAmount: number;
    createdAt: string;
}

export interface OrderFilters {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    outletId?: string;
    paymentStatus?: string;
}

export interface CreateOrderData {
    outletId: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
}

export interface UpdateOrderData {
    status?: string;
    notes?: string;
}

// Query hooks
export const useOrders = (filters?: OrderFilters) => {
    return useQuery({
        queryKey: ['orders', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.status) params.append('status', filters.status);
            if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (filters?.search) params.append('search', filters.search);
            if (filters?.outletId) params.append('outletId', filters.outletId);

            const queryString = params.toString();
            const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get(endpoint);
            return response.data.data;
        },
    });
};

export const useOrder = (orderId: string) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const response = await apiClient.get(`/orders/${orderId}`);
            return response.data.data;
        },
        enabled: !!orderId,
    });
};

export const useOrderStats = (outletId: string, period: 'week' | 'month' = 'month') => {
    return useQuery({
        queryKey: ['order-stats', outletId, period],
        queryFn: async () => {
            const response = await apiClient.get(`/dashboard/stats?outletId=${outletId}&period=${period}`);
            return response.data.data;
        },
        enabled: !!outletId,
    });
};

// Mutation hooks
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderData: CreateOrderData) => {
            const response = await apiClient.post('/orders', orderData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ['order-stats', data.outletId] });
        },
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, orderData }: { orderId: string; orderData: UpdateOrderData }) => {
            const response = await apiClient.patch(`/orders/${orderId}`, orderData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate order detail and orders list
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ['order-stats', data.outletId] });
        },
    });
};

export const useRefundOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderId: string) => {
            const response = await apiClient.post(`/orders/${orderId}/refund`);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate order detail and orders list
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ['order-stats', data.outletId] });
        },
    });
};

// File operations (still using fetch for blob handling)
export const orderApiFileOps = {
    getReceipt: orderApi.getReceipt,
};