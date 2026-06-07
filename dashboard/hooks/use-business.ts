import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apis/base';
import { BannerFormValues } from '@/features/admin/banners/banner-form';
import { KPIItem } from '@/types/kpis';

export const SubscriptionStatus = {
    ALL: 'ALL',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    SUSPENDED: 'SUSPENDED',
    CANCELLED: 'CANCELLED',
} as const

export type SubscriptionStatus =
    typeof SubscriptionStatus[keyof typeof SubscriptionStatus]


export interface Business {
    id: string
    name: string
    subscriptionEndDate?: string
    subscriptionPlan: "BASIC" | "PRO" | "ENTERPRISE"
    subscriptionStatus: SubscriptionStatus
    createdAt: string
    owner: Owner
}

export interface Owner {
    name: string
    email: string
}

export interface Banner {
    id: string
    title: string
    subtitle: string
    imageUrl: string
    ctaType: string
    ctaPayload?: string
    sortOrder: number
    isActive: boolean
    businessId: any
    createdAt: string
    updatedAt: string
}

export const useBusiness = (params: { name?: string, status?: SubscriptionStatus }) => {
    return useQuery({
        queryKey: ['business', params.name ?? '', params.status ?? 'ALL'],
        enabled: !!params.name || !!params.status,
        retry: 1,
        staleTime: 1000 * 60,
        queryFn: async (): Promise<Business[]> => {
            return (await apiClient.get(`/business/all`, { params })).data.data
        }
    })
}

export const useKPIsBusiness = () => {
    return useQuery({
        queryKey: ['business-kpis'],
        retry: 1,
        staleTime: 1000 * 60,
        queryFn: async (): Promise<{
            totalMerchants: KPIItem,
            subscriptionRevenue: KPIItem,
            platformHealth: KPIItem,
        }> => {
            return (await apiClient.get(`/business/kpis`)).data.data
        }
    })
}

// Mutation hooks
export const useCreateBanner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData: Partial<BannerFormValues>) => {
            const response = await apiClient.post('/banners', productData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch products for the outlet
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });
};

export const useUpdateBanner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bannerId, data }: { bannerId: string; data: Partial<BannerFormValues> }) => {
            const response = await apiClient.put(`/banners/${bannerId}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidate product detail and product list
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });
};

export const useDeleteBanner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (bannerId: string) => {
            await apiClient.delete(`/banners/${bannerId}`);
            return bannerId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
        },
    });
};