import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";

export interface OutletReport {
  label: string;
  jumlahTransaksi: number;
  totalPendapatan: number;
  totalPembelian: number;
  totalPengeluaran: number;
  gajiStaf: number;
  labaBersih: number;
  trend: number[];
}

export function useReportOutlet(outletId: string, type: any, date?: string) {
  return useQuery({
    queryKey: ["outlet-report", type, date, outletId],
    enabled: !!outletId,
    queryFn: async (): Promise<OutletReport[]> => {
      return (
        await apiClient.get(`/reports/outlet/${outletId}`, {
          params: { type, date },
        })
      ).data.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useCompareOutletsReport(type: any, date?: string) {
  return useQuery({
    queryKey: ["compare-outlets-report", type, date],
    queryFn: async (): Promise<OutletReport[]> => {
      return (
        await apiClient.get(`/reports/compare`, {
          params: { type, date },
        })
      ).data.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export interface StaffReportItem {
  staffId: string;
  name: string;
  role: string;
  type: "CASHIER" | "SERVICE";
  transactionCount: number;
  revenue: number;
  commission: number;
}

export function useReportStaff(outletId: string, type: any, date?: string) {
  return useQuery({
    queryKey: ["staff-report", type, date, outletId],
    enabled: !!outletId,
    queryFn: async (): Promise<StaffReportItem[]> => {
      return (
        await apiClient.get(`/reports/staff/${outletId}`, {
          params: { type, date },
        })
      ).data.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
