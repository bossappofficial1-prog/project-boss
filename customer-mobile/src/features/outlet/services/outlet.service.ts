import { apiClient } from "@/services/api-client";
import type { OutletDetail, OutletProductsResponse, ProductDetail } from "../types/outlet.types";

export async function getOutletBySlug(slug: string): Promise<OutletDetail> {
  const res = await apiClient.get<{ data: OutletDetail }>(`/outlets/slug/${slug}`);
  return res.data;
}

export async function getOutletById(id: string): Promise<OutletDetail> {
  const res = await apiClient.get<{ data: OutletDetail }>(`/outlets/${id}`);
  return res.data;
}

export async function getOutletProducts(
  slug: string,
  params?: { page?: number; limit?: number; type?: string }
): Promise<OutletProductsResponse> {
  const query = new URLSearchParams();
  query.set("accessed", "PUBLIC");
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.type) query.set("type", params.type);

  const res = await apiClient.get<OutletProductsResponse>(
    `/products/outlet/${slug}?${query.toString()}`
  );
  return res;
}

export async function getProductDetail(productId: string): Promise<ProductDetail> {
  const res = await apiClient.get<{ data: ProductDetail }>(`/products/${productId}`);
  return res.data;
}
