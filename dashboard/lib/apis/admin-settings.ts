import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "./base";
import { toast } from "sonner";

// Types
export interface PlatformSettingValue {
  platform: {
    name: string;
    version: string;
    maintenanceMode: boolean;
    logoUrl?: string;
  };
  fees: {
    appFeePercent: number;
    midtransFeePercent: number;
    minimumWithdrawal: number;
  };
  notifications: {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  limits: {
    maxBusinessesPerOwner: number;
    maxOutletsPerBusiness: number;
    maxProductsPerOutlet: number;
  };
}

// Hooks
export function usePlatformSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      return data.data as PlatformSettingValue;
    },
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PlatformSettingValue>) => {
      const { data } = await api.put("/admin/settings", settings);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Settings berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal update settings");
    },
  });
}

export function useSettingByKey(key: string) {
  return useQuery({
    queryKey: ["admin", "settings", key],
    queryFn: async () => {
      const { data } = await api.get(`/admin/settings/${key}`);
      return data.data;
    },
    enabled: !!key,
  });
}

export function useSetSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data } = await api.put(`/admin/settings/${key}`, { value });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Setting berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal update setting");
    },
  });
}
