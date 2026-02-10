import { useQuery } from "@tanstack/react-query"
import { stockApi } from "@/lib/api"

export interface StockOverview {
    totalProducts: number
    totalStockValue: number
    lowStockCount: number
    outOfStockCount: number
    recentMovements: Record<string, { count: number; totalQty: number }>
}

const fetchStockOverview = async (outletId: string): Promise<StockOverview> => {
    const res = await stockApi.getOverview(outletId)
    return res.data
}

export function useStockOverview(outletId: string | null | undefined) {
    return useQuery({
        queryKey: ["stock-overview", outletId],
        queryFn: () => fetchStockOverview(outletId!),
        enabled: !!outletId,
    })
}
