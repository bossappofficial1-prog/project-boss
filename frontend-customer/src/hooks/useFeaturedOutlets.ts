import { useQuery } from '@tanstack/react-query';
import { Outlet } from '@/services/outlets';

export function useFeaturedOutlets() {
    return useQuery<any[], Error>({
        queryKey: ['outlets', 'featured'],
        queryFn: () =>
            Outlet.getFeatured()
    });
}
