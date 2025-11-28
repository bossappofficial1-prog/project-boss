import { apiClient } from "@/lib/apis/base"

import { useQuery } from "@tanstack/react-query"

export interface AdminOverviewKPIsResponse {
    today: number
    todayGrowth: number
    week: number
    weekGrowth: number
    month: number
    monthGrowth: number
    businessActive: number
    withdrawalPending: number
    failedTransaction: number
}

export const useKPIs = () => useQuery({
    queryKey: ['kpis-data'],
    queryFn: async (): Promise<AdminOverviewKPIsResponse> => {
        const response = await apiClient.get('/admin/dashboard/kpis-metrics');
        return response.data
    }
})