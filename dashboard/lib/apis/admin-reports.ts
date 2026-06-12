import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "./base";
import { toast } from "sonner";

// Types
export interface Report {
  id: string;
  type: string;
  period: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  title: string;
  parameters?: Record<string, any>;
  fileUrl?: string;
  fileSize?: number;
  generatedBy: string;
  generatedByUser: {
    id: string;
    name: string;
    email: string;
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilters {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GenerateReportInput {
  type: string;
  period: string;
  startDate?: string;
  endDate?: string;
}

// Hooks
export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ["admin-reports", filters],
    queryFn: async () => {
      const { data } = await api.get("/admin/reports", { params: filters });
      return data;
    },
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["admin-reports", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/reports/${id}`);
      return data.data as Report;
    },
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateReportInput) => {
      const { data } = await api.post("/admin/reports/generate", input);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Laporan sedang diproses");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal generate laporan");
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/reports/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Laporan berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus laporan");
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const response = await api.get(`/admin/reports/${reportId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    },
    onSuccess: () => {
      toast.success("Download berhasil");
    },
    onError: (error: any) => {
      toast.error("Gagal download laporan");
    },
  });
}
