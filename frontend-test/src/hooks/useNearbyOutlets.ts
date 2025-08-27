import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getNearbyOutlets } from '@/lib/api';
import { NearbyOutletsParams } from '@/types';
import { Outlet } from '@/services/outlets';

interface UseNearbyOutletsParams extends Omit<NearbyOutletsParams, 'skip'> {
    enabled?: boolean;
}

export function useNearbyOutlets(params: UseNearbyOutletsParams) {
    return useInfiniteQuery({
        queryKey: ['nearbyOutlets', params],
        queryFn: ({ pageParam = 0 }) =>
            getNearbyOutlets({
                ...params,
                skip: pageParam,
                take: params.take || 10,
            }),
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.length * (params.take || 10);
        },
        enabled: params.enabled !== false && !!(params.latitude && params.longitude),
        initialPageParam: 0,
    });
}

export function useNearbyOutletsSingle(params: UseNearbyOutletsParams) {
    return useQuery({
        queryKey: ['nearbyOutlets', params],
        queryFn: () => Outlet.getNearby({ ...params, take: 3 }),
        enabled: Boolean(params.latitude && params.longitude)
    })
}
