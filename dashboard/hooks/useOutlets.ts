'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type { Outlet } from '@/types/dashboard';

interface OutletsResponse {
    outlets: Outlet[];
    business: any;
    user: any;
}

export const useOutletsQuery = () => {
    return useQuery({
        queryKey: ['outlets'],
        queryFn: async (): Promise<OutletsResponse> => {
            const response = await authApi.me();
            return response;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};