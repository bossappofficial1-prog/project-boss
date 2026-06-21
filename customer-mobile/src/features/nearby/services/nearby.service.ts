import { apiClient } from "@/services/api-client";

export interface NearbyOutlet {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  address: string;
  phone: string;
  image: string | null;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  distance?: number;
  duration?: number;
  type?: string;
  operatingHours?: any[];
  business?: { id: string; name: string };
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
  take?: number;
  skip?: number;
  search?: string;
}

export async function getNearbyOutlets(params: NearbyParams): Promise<{
  data: NearbyOutlet[];
  total: number;
  hasMore: boolean;
}> {
  const query = new URLSearchParams();
  query.set("latitude", String(params.latitude));
  query.set("longitude", String(params.longitude));
  if (params.radius) query.set("radius", String(params.radius));
  if (params.take) query.set("take", String(params.take));
  if (params.skip) query.set("skip", String(params.skip));
  if (params.search) query.set("search", params.search);

  const res = await apiClient.get<{ data: NearbyOutlet[]; pagination?: { total: number; page: number; totalPages: number } }>(
    `/outlets/nearby?${query.toString()}`,
  );
  const total = res.pagination?.total ?? res.data.length;
  const hasMore = res.pagination ? res.pagination.page < res.pagination.totalPages : false;
  return { data: res.data, total, hasMore };
}

export async function getOutletsInViewport(params: {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  search?: string;
}): Promise<NearbyOutlet[]> {
  const query = new URLSearchParams({
    latMin: String(params.latMin),
    latMax: String(params.latMax),
    lngMin: String(params.lngMin),
    lngMax: String(params.lngMax),
  });
  if (params.search) query.set("search", params.search);

  const res = await apiClient.get<{ data: NearbyOutlet[] }>(
    `/outlets/map?${query.toString()}`,
  );
  return res.data;
}
