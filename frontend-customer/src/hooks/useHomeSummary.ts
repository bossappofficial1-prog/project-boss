import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { HomeSummaryResponse } from '@/types/home'

export function useHomeSummary() {
    return useQuery<HomeSummaryResponse>({
        queryKey: ['home', 'summary'],
        queryFn: () => api.getData<HomeSummaryResponse>('/home'),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    })
}
