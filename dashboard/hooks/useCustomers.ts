import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apis/base';

export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    createdAt: string;
    orders?: Array<{
        id: string;
        totalAmount?: number;
        orderStatus?: string;
        paymentStatus?: string;
        createdAt?: string;
    }>;
    memberships: any[];
    _count: {
        orders: number;
    };
}

export interface CustomerFilters {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerData {
    name: string;
    email?: string;
    phone: string;
}

export interface UpdateCustomerData {
    name?: string;
    email?: string;
    phone?: string;
}

// Query hooks
export const useCustomers = (outletId: string | null | undefined, filters?: CustomerFilters) => {
    return useQuery({
        queryKey: ['customers', outletId, filters],
        queryFn: async () => {
            if (!outletId) return { members: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };

            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.search) params.append('search', filters.search);
            if (filters?.sortBy) params.append('sortBy', filters.sortBy);
            if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

            const queryString = params.toString();
            const endpoint = `/members/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get(endpoint);
            return response.data.data;
        },
        enabled: !!outletId,
    });
};

export const useCustomer = (memberId: string, outletId?: string | null) => {
    return useQuery({
        queryKey: ['customer', memberId, outletId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (outletId) params.append('outletId', outletId);
            const queryString = params.toString();

            const response = await apiClient.get(`/members/${memberId}${queryString ? `?${queryString}` : ''}`);
            return response.data.data;
        },
        enabled: !!memberId,
    });
};

// Mutation hooks
export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (customerData: CreateCustomerData) => {
            const response = await apiClient.post('/members', customerData);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateCustomerData }) => {
            const response = await apiClient.patch(`/members/${memberId}`, data);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customer', variables.memberId] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (memberId: string) => {
            await apiClient.delete(`/members/${memberId}`);
            return memberId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};
