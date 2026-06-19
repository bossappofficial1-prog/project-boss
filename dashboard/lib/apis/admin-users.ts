import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { gooeyToast } from "goey-toast";
import { apiClient } from "./base";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isVerified: boolean;
  phone?: string;
  provider?: string;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    name: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
}

export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/users", { params: filters });
      return data;
    },
  });
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: ["admin", "users", "stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/users/stats");
      return data.data as UserStats;
    },
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/users/${id}`);
      return data.data as AdminUser;
    },
    enabled: !!id,
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      const { data } = await apiClient.put(`/admin/users/${userId}/suspend`, {
        reason,
      });
      return data;
    },
    onSuccess: (data) => {
      gooeyToast.success(data.message || "User berhasil disuspend");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      gooeyToast.error(error.response?.data?.message || "Gagal suspend user");
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.put(`/admin/users/${userId}/reactivate`);
      return data;
    },
    onSuccess: (data) => {
      gooeyToast.success(data.message || "User berhasil diaktifkan");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      gooeyToast.error(error.response?.data?.message || "Gagal mengaktifkan user");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.delete(`/admin/users/${userId}`);
      return data;
    },
    onSuccess: (data) => {
      gooeyToast.success(data.message || "User berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      gooeyToast.error(error.response?.data?.message || "Gagal menghapus user");
    },
  });
}

export function useBulkSuspendUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userIds,
      reason,
    }: {
      userIds: string[];
      reason?: string;
    }) => {
      const { data } = await apiClient.post("/admin/users/bulk/suspend", {
        userIds,
        reason,
      });
      return data;
    },
    onSuccess: (data) => {
      gooeyToast.success(data.message || "Bulk suspend selesai");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      gooeyToast.error(error.response?.data?.message || "Gagal bulk suspend");
    },
  });
}

export function useBulkReactivateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const { data } = await apiClient.post("/admin/users/bulk/reactivate", {
        userIds,
      });
      return data;
    },
    onSuccess: (data) => {
      gooeyToast.success(data.message || "Bulk reactivate selesai");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: any) => {
      gooeyToast.error(error.response?.data?.message || "Gagal bulk reactivate");
    },
  });
}
