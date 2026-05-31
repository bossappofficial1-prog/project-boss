import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loyaltyApi,
  type GetMembersQuery,
  type RegisterMemberRequest,
  type LoyaltyConfig,
  type CreateLoyaltyTierRequest,
  type UpdateLoyaltyTierRequest,
  type CreateLoyaltyRewardRequest,
  type UpdateLoyaltyRewardRequest,
  type LoyaltyReward,
} from "@/lib/apis/loyalty";

const KEYS = {
  config: (outletId: string) => ["loyalty", "config", outletId] as const,
  tiers: (outletId: string) => ["loyalty", "tiers", outletId] as const,
  rewards: (outletId: string) => ["loyalty", "rewards", outletId] as const,
  members: (outletId: string, query?: GetMembersQuery) => ["loyalty", "members", outletId, query] as const,
  pointHistory: (outletId: string, guestCustomerId: string, page: number, limit: number) =>
    ["loyalty", "point-history", outletId, guestCustomerId, page, limit] as const,
  redemptions: (outletId: string, guestCustomerId: string) =>
    ["loyalty", "redemptions", outletId, guestCustomerId] as const,
};

// ─── Config ───────────────────────────────────────────────────────────────────
export function useLoyaltyConfig(outletId: string) {
  return useQuery<LoyaltyConfig | null>({
    queryKey: KEYS.config(outletId),
    queryFn: async () => {
      const cacheKey = `boss_loyalty_config_cache_${outletId}`;
      const isOffline = typeof window !== "undefined" && !navigator.onLine;

      if (isOffline) {
        const cached = localStorage.getItem(cacheKey);
        return cached ? (JSON.parse(cached) as LoyaltyConfig) : null;
      }

      try {
        const data = await loyaltyApi.getConfig(outletId);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      } catch (err) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached) as LoyaltyConfig;
        throw err;
      }
    },
    enabled: !!outletId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertLoyaltyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, data }: { outletId: string; data: Partial<LoyaltyConfig> }) =>
      loyaltyApi.upsertConfig(outletId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.config(variables.outletId) });
    },
  });
}

// ─── Tiers ────────────────────────────────────────────────────────────────────
export function useLoyaltyTiers(outletId: string) {
  return useQuery({
    queryKey: KEYS.tiers(outletId),
    queryFn: () => loyaltyApi.getTiers(outletId),
    enabled: !!outletId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateLoyaltyTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, data }: { outletId: string; data: CreateLoyaltyTierRequest }) =>
      loyaltyApi.createTier(outletId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.tiers(variables.outletId) });
    },
  });
}

export function useUpdateLoyaltyTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, tierId, data }: { outletId: string; tierId: string; data: UpdateLoyaltyTierRequest }) =>
      loyaltyApi.updateTier(outletId, tierId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.tiers(variables.outletId) });
      queryClient.invalidateQueries({ queryKey: ["loyalty", "members", variables.outletId] });
    },
  });
}

export function useDeleteLoyaltyTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, tierId }: { outletId: string; tierId: string }) =>
      loyaltyApi.deleteTier(outletId, tierId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.tiers(variables.outletId) });
    },
  });
}

// ─── Rewards ──────────────────────────────────────────────────────────────────
export function useLoyaltyRewards(outletId: string, includeInactive = false) {
  return useQuery<LoyaltyReward[]>({
    queryKey: [...KEYS.rewards(outletId), includeInactive],
    queryFn: async () => {
      const cacheKey = `boss_loyalty_rewards_cache_${outletId}_${includeInactive}`;
      const isOffline = typeof window !== "undefined" && !navigator.onLine;

      if (isOffline) {
        const cached = localStorage.getItem(cacheKey);
        return cached ? (JSON.parse(cached) as LoyaltyReward[]) : [];
      }

      try {
        const data = await loyaltyApi.getRewards(outletId, includeInactive);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      } catch (err) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached) as LoyaltyReward[];
        return [];
      }
    },
    enabled: !!outletId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, data }: { outletId: string; data: CreateLoyaltyRewardRequest }) =>
      loyaltyApi.createReward(outletId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.rewards(variables.outletId) });
    },
  });
}

export function useUpdateLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      outletId,
      rewardId,
      data,
    }: {
      outletId: string;
      rewardId: string;
      data: UpdateLoyaltyRewardRequest;
    }) => loyaltyApi.updateReward(outletId, rewardId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.rewards(variables.outletId) });
    },
  });
}

export function useDeleteLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outletId, rewardId }: { outletId: string; rewardId: string }) =>
      loyaltyApi.deleteReward(outletId, rewardId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.rewards(variables.outletId) });
    },
  });
}

export function useRedeemLoyaltyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      outletId,
      data,
    }: {
      outletId: string;
      data: { guestCustomerId: string; loyaltyRewardId: string; orderId?: string };
    }) => loyaltyApi.redeemReward(outletId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty", "members", variables.outletId] });
    },
  });
}

// ─── Members ──────────────────────────────────────────────────────────────────
export function useLoyaltyMembers(outletId: string, query: GetMembersQuery = {}) {
  return useQuery({
    queryKey: KEYS.members(outletId, query),
    queryFn: () => loyaltyApi.getMembers(outletId, query),
    enabled: !!outletId,
    staleTime: 1000 * 60 * 1,
  });
}

export function useRegisterLoyaltyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterMemberRequest) => loyaltyApi.registerMember(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.members(variables.outletId) });
    },
  });
}

export function useAdjustPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      outletId,
      guestCustomerId,
      points,
      note,
    }: {
      outletId: string;
      guestCustomerId: string;
      points: number;
      note?: string;
    }) => loyaltyApi.adjustPoints(outletId, guestCustomerId, points, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty", "members", variables.outletId] });
      queryClient.invalidateQueries({
        queryKey: ["loyalty", "point-history", variables.outletId, variables.guestCustomerId],
      });
    },
  });
}

export function useLoyaltyPointHistory(
  outletId: string,
  guestCustomerId: string,
  query: { page?: number; limit?: number } = {},
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  return useQuery({
    queryKey: KEYS.pointHistory(outletId, guestCustomerId, page, limit),
    queryFn: () => loyaltyApi.getMemberPointHistory(outletId, guestCustomerId, { page, limit }),
    enabled: !!outletId && !!guestCustomerId,
    staleTime: 1000 * 30,
  });
}

export function useMemberRedemptions(outletId: string, guestCustomerId: string) {
  return useQuery({
    queryKey: KEYS.redemptions(outletId, guestCustomerId),
    queryFn: () => loyaltyApi.getMemberRedemptions(outletId, guestCustomerId),
    enabled: !!outletId && !!guestCustomerId,
    staleTime: 1000 * 30,
  });
}
