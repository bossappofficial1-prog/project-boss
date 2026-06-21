import { useInfiniteQuery } from "@tanstack/react-query";
import { getNearbyOutlets } from "../services/nearby.service";

interface UseNearbyParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  search?: string;
  enabled?: boolean;
}

export function useNearbyOutlets(params: UseNearbyParams) {
  return useInfiniteQuery({
    queryKey: ["nearbyOutlets", params],
    queryFn: ({ pageParam = 0 }) =>
      getNearbyOutlets({
        latitude: params.latitude!,
        longitude: params.longitude!,
        radius: params.radius,
        search: params.search,
        skip: pageParam,
        take: 10,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 10;
    },
    staleTime: 50_000,
    enabled: params.enabled !== false && !!(params.latitude && params.longitude),
    initialPageParam: 0,
  });
}
