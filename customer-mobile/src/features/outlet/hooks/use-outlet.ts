import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getOutletBySlug,
  getOutletProducts,
  getProductDetail,
} from "../services/outlet.service";

export function useGetOutletBySlug(slug: string) {
  return useQuery({
    queryKey: ["outlet", slug],
    queryFn: () => getOutletBySlug(slug),
    enabled: !!slug,
  });
}

export function useGetOutletProducts(
  slug: string,
  params?: { limit?: number; type?: string }
) {
  return useInfiniteQuery({
    queryKey: ["outlet-products", slug, params],
    queryFn: ({ pageParam = 1 }) =>
      getOutletProducts(slug, { ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!slug,
  });
}

export function useGetProductDetail(productId: string) {
  return useQuery({
    queryKey: ["product-detail", productId],
    queryFn: () => getProductDetail(productId),
    enabled: !!productId,
  });
}
