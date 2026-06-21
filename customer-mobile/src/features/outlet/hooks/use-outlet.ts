import { useQuery } from "@tanstack/react-query";
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
  outletId: string,
  params?: { page?: number; limit?: number; type?: string }
) {
  return useQuery({
    queryKey: ["outlet-products", outletId, params],
    queryFn: () => getOutletProducts(outletId, params),
    enabled: !!outletId,
  });
}

export function useGetProductDetail(productId: string) {
  return useQuery({
    queryKey: ["product-detail", productId],
    queryFn: () => getProductDetail(productId),
    enabled: !!productId,
  });
}
