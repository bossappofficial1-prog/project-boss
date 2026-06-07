import { useQuery } from '@tanstack/react-query';
import { outletApi } from '@/lib/api';
import type { OutletRevenueTrendResponse, TimeframeFilter } from '@/types/outlet';

type OutletRevenueTrendOptions = {
    timeframe?: TimeframeFilter;
    startDate?: string;
    endDate?: string;
};

export function useOutletRevenueTrend(outletId?: string, options?: OutletRevenueTrendOptions) {
    return useQuery<OutletRevenueTrendResponse, Error>({
        queryKey: ['outlet-revenue-trend', outletId, options?.timeframe ?? '30d', options?.startDate, options?.endDate],
        queryFn: async () => {
            if (!outletId) {
                throw new Error('Outlet belum dipilih');
            }

            return outletApi.getRevenueTrend(outletId, {
                timeframe: options?.timeframe ?? '30d',
                startDate: options?.startDate,
                endDate: options?.endDate,
            });
        },
        enabled: Boolean(outletId),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}
