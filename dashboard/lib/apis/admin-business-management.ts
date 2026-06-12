import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "./base";
import { toast } from "sonner";

// Types
export interface BusinessHealthScore {
  score: number;
  breakdown: {
    subscription: { score: number; max: number; detail: string };
    activity: { score: number; max: number; detail: string };
    revenue: { score: number; max: number; detail: string };
    outlets: { score: number; max: number; detail: string };
  };
  level: "excellent" | "good" | "fair" | "poor" | "critical";
}

export interface BusinessActivity {
  type: "order" | "invoice";
  date: string;
  data: any;
}

export interface BusinessSettings {
  customOutletLimit?: number | null;
  customProductLimit?: number | null;
  customStaffLimit?: number | null;
  featureFlags?: Record<string, boolean>;
  notes?: string;
}

// Hooks
export function useBusinessDetails(businessId: string) {
  return useQuery({
    queryKey: ["admin", "businesses", businessId, "details"],
    queryFn: async () => {
      const { data } = await api.get(`/admin/businesses/${businessId}`);
      return data.data;
    },
    enabled: !!businessId,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: {
        name?: string;
        description?: string;
        bankName?: string;
        bankAccount?: string;
        accountHolder?: string;
      };
    }) => {
      const { data: result } = await api.put(
        `/admin/businesses/${businessId}/details`,
        data,
      );
      return result;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Bisnis berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["admin", "businesses"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "businesses", variables.businessId],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal update bisnis");
    },
  });
}

export function useBusinessHealthScore(businessId: string) {
  return useQuery({
    queryKey: ["admin", "businesses", businessId, "health-score"],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/businesses/${businessId}/health-score`,
      );
      return data.data as BusinessHealthScore;
    },
    enabled: !!businessId,
  });
}

export function useBusinessActivity(businessId: string, limit = 20) {
  return useQuery({
    queryKey: ["admin", "businesses", businessId, "activity", limit],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/businesses/${businessId}/activity`,
        { params: { limit } },
      );
      return data.data as BusinessActivity[];
    },
    enabled: !!businessId,
  });
}

export function useBusinessSettings(businessId: string) {
  return useQuery({
    queryKey: ["admin", "businesses", businessId, "settings"],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/businesses/${businessId}/settings`,
      );
      return data.data as BusinessSettings;
    },
    enabled: !!businessId,
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      settings,
    }: {
      businessId: string;
      settings: BusinessSettings;
    }) => {
      const { data } = await api.put(
        `/admin/businesses/${businessId}/settings`,
        settings,
      );
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Pengaturan berhasil diupdate");
      queryClient.invalidateQueries({
        queryKey: ["admin", "businesses", variables.businessId, "settings"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal update pengaturan");
    },
  });
}

// Subscription Management
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["admin", "subscriptions", "plans"],
    queryFn: async () => {
      const { data } = await api.get("/admin/subscriptions/plans");
      return data.data;
    },
  });
}

export function useBusinessSubscription(businessId: string) {
  return useQuery({
    queryKey: ["admin", "subscriptions", "business", businessId],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/subscriptions/business/${businessId}`,
      );
      return data.data;
    },
    enabled: !!businessId,
  });
}

export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      planId,
    }: {
      businessId: string;
      planId: string;
    }) => {
      const { data } = await api.put(
        `/admin/subscriptions/business/${businessId}/change-plan`,
        { planId },
      );
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Plan berhasil diubah");
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscriptions", "business", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "businesses", variables.businessId],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengubah plan");
    },
  });
}

export function useExtendSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      days,
    }: {
      businessId: string;
      days: number;
    }) => {
      const { data } = await api.put(
        `/admin/subscriptions/business/${businessId}/extend`,
        { days },
      );
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Langganan berhasil diperpanjang");
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscriptions", "business", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "businesses", variables.businessId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal memperpanjang langganan",
      );
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      reason,
    }: {
      businessId: string;
      reason: string;
    }) => {
      const { data } = await api.put(
        `/admin/subscriptions/business/${businessId}/cancel`,
        { reason },
      );
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Langganan berhasil dibatalkan");
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscriptions", "business", variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "businesses", variables.businessId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Gagal membatalkan langganan",
      );
    },
  });
}

export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      invoiceId,
    }: {
      businessId: string;
      invoiceId: string;
    }) => {
      const { data } = await api.put(
        `/admin/subscriptions/business/${businessId}/mark-paid`,
        { invoiceId },
      );
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Invoice ditandai lunas");
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscriptions", "business", variables.businessId],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menandai invoice");
    },
  });
}

// Notifications
export function useSendNotification() {
  return useMutation({
    mutationFn: async (input: {
      businessId: string;
      subject: string;
      message: string;
      type: string;
      channels: string[];
    }) => {
      const { data } = await api.post("/admin/notifications/send", input);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Notifikasi terkirim");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengirim notifikasi");
    },
  });
}

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: async (input: {
      subject: string;
      message: string;
      type: string;
      channels: string[];
      filter?: any;
    }) => {
      const { data } = await api.post("/admin/notifications/broadcast", input);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Broadcast terkirim");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengirim broadcast");
    },
  });
}

export function useBusinessNotifications(businessId: string) {
  return useQuery({
    queryKey: ["admin", "notifications", "business", businessId],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/notifications/business/${businessId}`,
      );
      return data.data;
    },
    enabled: !!businessId,
  });
}
