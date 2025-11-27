'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { outletApi } from '@/lib/api';
import type { OutletAnalyticsResponse } from '@/types/outlet';

type UseOutletAnalyticsOptions = {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchInterval?: number | false;
    refetchOnWindowFocus?: boolean;
};

export function useOutletAnalytics(outletId?: string, options?: UseOutletAnalyticsOptions) {
    const query = useQuery<OutletAnalyticsResponse, Error>({
        queryKey: ['outlet-analytics', outletId],
        queryFn: async () => {
            if (!outletId) {
                throw new Error('Outlet belum dipilih');
            }
            return outletApi.getAnalytics(outletId);
        },
        enabled: Boolean(outletId) && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? 60_000,
        gcTime: options?.gcTime ?? 300_000,
        refetchInterval: options?.refetchInterval,
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 2,
    });

    const hasData = useMemo(() => Boolean(query.data), [query.data]);

    return {
        ...query,
        hasData,
    };
}
