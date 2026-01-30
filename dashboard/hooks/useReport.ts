import { useQuery } from "@tanstack/react-query";
import { apiClient } from '@/lib/apis/base';

export interface OutletReport {
    label: string
    jumlahTransaksi: number
    totalPendapatan: number
    totalPembelian: number
    totalPengeluaran: number
    gajiStaf: number
    labaBersih: number
    trend: number[]
}

export function useReportOutlet(outletId: string, type: any, date?: string) {
    return useQuery({
        queryKey: ['outler-report', type, date],
        enabled: !!outletId,
        queryFn: async (): Promise<OutletReport[]> => {
            return (await apiClient.get(`/reports/outlet/${outletId}`, {
                params: { type, date }
            })).data.data
        }
    })
}