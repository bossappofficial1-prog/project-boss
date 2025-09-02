import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useUser() {
    return useQuery<any, Error>({
        queryKey: ['auth', 'me'],
        queryFn: () =>
            api.get('/auth/me').then((res) => {
                const d = res.data;
                return (d.data?.user ?? d.data ?? d.user ?? d) as any;
            }),
        retry: false,
    });
}
