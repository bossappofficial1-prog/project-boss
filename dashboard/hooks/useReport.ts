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
    queryKey: ["outler-report", type, date, outletId],
    enabled: !!outletId,
    queryFn: async (): Promise<OutletReport[]> => {
      return (
        await apiClient.get(`/reports/outlet/${outletId}`, {
          params: { type, date },
        })
      ).data.data;
    },
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
  });
}
