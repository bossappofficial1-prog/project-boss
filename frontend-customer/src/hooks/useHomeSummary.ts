import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { HomeSummaryResponse } from '@/types/home'

export function useHomeSummary() {
    return useQuery<HomeSummaryResponse>({
        queryKey: ['home', 'summary'],
        queryFn: () => api.getData<HomeSummaryResponse>('/home'),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: 'always',
        refetchInterval: 1000 * 60,
        refetchIntervalInBackground: false,
    })
}
