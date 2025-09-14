import { useInfiniteQuery } from '@tanstack/react-query';
import { searchOutlets, type SearchOutletsParams } from '@/lib/api';

interface UseSearchOutletsParams extends Omit<SearchOutletsParams, 'skip'> {
    enabled?: boolean;
}

export function useSearchOutlets(params: UseSearchOutletsParams) {
    return useInfiniteQuery({
        queryKey: ['searchOutlets', params],
        queryFn: ({ pageParam = 0 }) =>
            searchOutlets({
                ...params,
                skip: pageParam,
                take: params.take || 10,
            }),
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.length * (params.take || 10);
        },
        enabled: params.enabled !== false,
        initialPageParam: 0,
    });
}
