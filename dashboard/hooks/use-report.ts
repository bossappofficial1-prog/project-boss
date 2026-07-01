import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";
import type { PeriodValue } from "@/components/ui/periode-picker";

function periodToParams(period: PeriodValue): Record<string, string | number> {
  switch (period.type) {
    case "daily":
      return { type: "daily", date: period.date };
    case "weekly":
      return {
        type: "weekly",
        date: period.startDate,
        startDate: period.startDate,
        endDate: period.endDate,
      };
    case "monthly":
      return {
        type: "monthly",
        date: `${period.year}-${String(period.month).padStart(2, "0")}-01`,
        month: period.month,
        year: period.year,
      };
    case "yearly":
      return {
        type: "yearly",
        date: `${period.year}-01-01`,
        year: period.year,
      };
  }
}

export interface OutletReport {
  label: string;
  jumlahTransaksi: number;
  totalPendapatan: number;
  totalPajak: number;
  totalPembelian: number;
  totalPengeluaran: number;
  gajiStaf: number;
  totalHpp: number;
  totalFees: number;
  labaBersih: number;
  trend: number[];
}

export function useReportOutlet(outletId: string, period: PeriodValue) {
  const params = periodToParams(period);
  return useQuery({
    queryKey: ["outlet-report", outletId, period],
    enabled: !!outletId,
    queryFn: async (): Promise<OutletReport[]> => {
      return (
        await apiClient.get(`/reports/outlet/${outletId}`, { params })
      ).data.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useCompareOutletsReport(period: PeriodValue) {
  const params = periodToParams(period);
  return useQuery({
    queryKey: ["compare-outlets-report", period],
    queryFn: async (): Promise<OutletReport[]> => {
      return (
        await apiClient.get(`/reports/compare`, { params })
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

export function useReportStaff(outletId: string, period: PeriodValue) {
  const params = periodToParams(period);
  return useQuery({
    queryKey: ["staff-report", outletId, period],
    enabled: !!outletId,
    queryFn: async (): Promise<StaffReportItem[]> => {
      return (
        await apiClient.get(`/reports/staff/${outletId}`, { params })
      ).data.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
