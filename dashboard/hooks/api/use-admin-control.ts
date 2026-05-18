import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";

// --- BUSINESS ---

export const useGetAdminBusinesses = (params: { page: number; limit: number; search?: string; status?: string }) => {
    return useQuery({
        queryKey: ["admin-businesses", params],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/businesses", { params });
            return data.data;
        },
    });
};

export const useUpdateBusinessSuspend = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ businessId, isSuspended }: { businessId: string; isSuspended: boolean }) => {
            const { data } = await apiClient.put(`/admin/businesses/${businessId}/suspend`, { isSuspended });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
        },
    });
};

// --- OUTLETS ---

export const useGetAdminOutlets = (params: { page: number; limit: number; search?: string; status?: string }) => {
    return useQuery({
        queryKey: ["admin-outlets", params],
        queryFn: async () => {
            const { data } = await apiClient.get("/admin/outlets", { params });
            return data.data;
        },
    });
};

export const useUpdateOutletForceClose = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ outletId, isClosed }: { outletId: string; isClosed: boolean }) => {
            const { data } = await apiClient.patch(`/admin/outlets/${outletId}/force-close`, { isClosed });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-outlets"] });
        },
    });
};

export const useDeleteBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (businessId: string) => {
            const { data } = await apiClient.delete(`/admin/businesses/${businessId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
        },
    });
};

export const useDeleteOutlet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (outletId: string) => {
            const { data } = await apiClient.delete(`/admin/outlets/${outletId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-outlets"] });
        },
    });
};
