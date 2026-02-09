import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";
import { BannerFormValues } from "@/components/admin/banners/BannerForm";
import { toast } from "sonner";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaType: string;
  ctaPayload?: string;
  sortOrder: number;
  isActive: boolean;
  businessId: any;
  createdAt: string;
  updatedAt: string;
}

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async (): Promise<Banner[]> => {
      return (await apiClient.get(`/banners`)).data.data;
    },
  });
};

// Mutation hooks
export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Partial<BannerFormValues>) => {
      const response = await apiClient.post("/banners", productData);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch products for the outlet
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bannerId,
      data,
    }: {
      bannerId: string;
      data: Partial<BannerFormValues>;
    }) => {
      const response = await apiClient.put(`/banners/${bannerId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate product detail and product list
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

type BulkUpdateBannerPayload = { data: { id: string; order: number }[] };
type BulkUpdateMutationContext = {
  previous?: Banner[];
};

export const useBulkUpdateBanner = (
  options?: UseMutationOptions<
    Banner[],
    unknown,
    BulkUpdateBannerPayload,
    BulkUpdateMutationContext
  >,
) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<Banner[], unknown, BulkUpdateBannerPayload, BulkUpdateMutationContext>({
    mutationFn: async ({ data }) => {
      const response = await apiClient.patch(`/banners/bulk-update`, data);
      return response.data.data;
    },
    onSuccess: (data, variables, context) => {
      toast.success("Berhasil update posisi banner");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onSuccess?.(data, variables, context, undefined as any);
    },
    ...restOptions,
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
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};
