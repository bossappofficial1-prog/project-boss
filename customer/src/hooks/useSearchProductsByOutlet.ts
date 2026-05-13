import { useQuery } from '@tanstack/react-query';
import { Product } from '@/services/product';

interface UseSearchProductsByOutletParams {
  outletId: string;
  search?: string;
  type?: 'GOODS' | 'SERVICE';
  enabled?: boolean;
}

export function useSearchProductsByOutlet(params: UseSearchProductsByOutletParams) {
  const { outletId, search, type, enabled = true } = params;

  return useQuery({
    queryKey: ['products', 'search', outletId, search, type],
    queryFn: () => Product.searchByOutlet({
      outletId,
      search,
      type,
      page: 1,
      limit: 100
    }),
    enabled: enabled && !!outletId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}
