import { apiCall, apiClient } from "./base";

// ─── Config ───────────────────────────────────────────────────────────────────
export interface LoyaltyConfig {
  id: string;
  outletId: string;
  pointsEarned: number;
  multiplierAmount: number;
  minSpending: number;
  pointValue: number;
  isActive: boolean;
  autoEnroll: boolean;
  welcomeBonus: number;
  maxRedeemPercent: number;
  expiryDays: number | null;
  minRedeemPoints: number;
  updatedAt: string;
}

// ─── Tier ─────────────────────────────────────────────────────────────────────
export interface LoyaltyTier {
  id: string;
  outletId: string;
  name: string;
  color: string;
  minLifetimePoints: number;
  earnMultiplier: number;
  sortOrder: number;
  benefits: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateLoyaltyTierRequest = Omit<LoyaltyTier, "id" | "outletId" | "createdAt" | "updatedAt">;
export type UpdateLoyaltyTierRequest = Partial<CreateLoyaltyTierRequest>;

// ─── Reward ───────────────────────────────────────────────────────────────────
export type LoyaltyRewardType = "DISCOUNT_FLAT" | "DISCOUNT_PERCENT" | "FREE_ITEM" | "VOUCHER" | "CASHBACK";

export interface LoyaltyReward {
  id: string;
  outletId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: LoyaltyRewardType;
  pointsCost: number;
  discountAmount: number | null;
  discountPercent: number | null;
  maxDiscount: number | null;
  productId: string | null;
  voucherValue: number | null;
  cashbackAmount: number | null;
  stock: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateLoyaltyRewardRequest = Omit<LoyaltyReward, "id" | "outletId" | "createdAt" | "updatedAt">;
export type UpdateLoyaltyRewardRequest = Partial<CreateLoyaltyRewardRequest>;

export interface RedeemRewardResult {
  pointsUsed: number;
  discountAmount: number;
  rewardType: LoyaltyRewardType;
  rewardName: string;
  redemptionId: string;
  freeProductId: string | null;
}

// ─── Membership ───────────────────────────────────────────────────────────────
export interface TierInfo {
  id: string;
  name: string;
  color: string;
}

export interface OutletMembership {
  id: string;
  guestCustomerId: string;
  outletId: string;
  points: number;
  lifetimePoints: number;
  tier: TierInfo | null;
  totalSpending: number;
  lastTransactionAt: string | null;
  joinedAt: string;
  status: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
}

export interface GetMembersQuery {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  sortBy?: "points" | "spending" | "joinedAt" | "lifetimePoints";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedMembers {
  members: OutletMembership[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RegisterMemberRequest {
  outletId: string;
  guestCustomerId?: string;
  name?: string;
  phone?: string;
}

// ─── Point History ────────────────────────────────────────────────────────────
export type LoyaltyPointHistoryType =
  | "EARN"
  | "REDEEM"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "WELCOME_BONUS"
  | "BIRTHDAY_BONUS"
  | "REWARD_REDEEM"
  | "EXPIRY";

export interface LoyaltyPointHistoryEntry {
  id: string;
  type: LoyaltyPointHistoryType;
  points: number;
  note: string | null;
  createdAt: string;
  order: {
    id: string;
    totalAmount: number;
    discountAmount: number;
    pointsRedeemed: number;
    createdAt: string;
  } | null;
}

export interface PaginatedPointHistory {
  history: LoyaltyPointHistoryEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Reward Redemption ────────────────────────────────────────────────────────
export interface RewardRedemption {
  id: string;
  pointsUsed: number;
  status: "PENDING" | "USED" | "EXPIRED" | "CANCELLED";
  note: string | null;
  createdAt: string;
  loyaltyReward: Pick<LoyaltyReward, "id" | "name" | "type">;
}

// ─── API Functions ─────────────────────────────────────────────────────────────
export const loyaltyApi = {
  // Config
  async getConfig(outletId: string): Promise<LoyaltyConfig | null> {
    const response = await apiClient.get<{ data: LoyaltyConfig | null }>(`/loyalty/config/${outletId}`);
    return response.data.data;
  },

  async upsertConfig(outletId: string, data: Partial<LoyaltyConfig>): Promise<LoyaltyConfig> {
    const response = await apiClient.put<{ data: LoyaltyConfig }>(`/loyalty/config/${outletId}`, data);
    return response.data.data;
  },

  // Tiers
  async getTiers(outletId: string): Promise<LoyaltyTier[]> {
    const response = await apiClient.get<{ data: LoyaltyTier[] }>(`/loyalty/tiers/${outletId}`);
    return response.data.data;
  },

  async createTier(outletId: string, data: CreateLoyaltyTierRequest): Promise<LoyaltyTier> {
    const response = await apiClient.post<{ data: LoyaltyTier }>(`/loyalty/tiers/${outletId}`, data);
    return response.data.data;
  },

  async updateTier(outletId: string, tierId: string, data: UpdateLoyaltyTierRequest): Promise<LoyaltyTier> {
    const response = await apiClient.put<{ data: LoyaltyTier }>(`/loyalty/tiers/${outletId}/${tierId}`, data);
    return response.data.data;
  },

  async deleteTier(outletId: string, tierId: string): Promise<void> {
    await apiClient.delete(`/loyalty/tiers/${outletId}/${tierId}`);
  },

  // Rewards
  async getRewards(outletId: string, includeInactive = false): Promise<LoyaltyReward[]> {
    const response = await apiClient.get<{ data: LoyaltyReward[] }>(
      `/loyalty/rewards/${outletId}?includeInactive=${includeInactive}`,
    );
    return response.data.data;
  },

  async createReward(outletId: string, data: CreateLoyaltyRewardRequest): Promise<LoyaltyReward> {
    const response = await apiClient.post<{ data: LoyaltyReward }>(`/loyalty/rewards/${outletId}`, data);
    return response.data.data;
  },

  async updateReward(outletId: string, rewardId: string, data: UpdateLoyaltyRewardRequest): Promise<LoyaltyReward> {
    const response = await apiClient.put<{ data: LoyaltyReward }>(`/loyalty/rewards/${outletId}/${rewardId}`, data);
    return response.data.data;
  },

  async deleteReward(outletId: string, rewardId: string): Promise<void> {
    await apiClient.delete(`/loyalty/rewards/${outletId}/${rewardId}`);
  },

  async redeemReward(
    outletId: string,
    data: { guestCustomerId: string; loyaltyRewardId: string; orderId?: string },
  ): Promise<RedeemRewardResult> {
    const response = await apiClient.post<{ data: RedeemRewardResult }>(`/loyalty/rewards/${outletId}/redeem`, data);
    return response.data.data;
  },

  // Members
  async getMembers(outletId: string, query: GetMembersQuery = {}): Promise<PaginatedMembers> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.search) params.append("search", query.search);
    if (query.tier) params.append("tier", query.tier);
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const response = await apiClient.get<{ data: PaginatedMembers }>(`/loyalty/members/${outletId}?${params}`);
    return response.data.data;
  },

  async registerMember(data: RegisterMemberRequest): Promise<OutletMembership> {
    const response = await apiClient.post<{ data: OutletMembership }>("/loyalty/register", data);
    return response.data.data;
  },

  async adjustPoints(
    outletId: string,
    guestCustomerId: string,
    points: number,
    note?: string,
  ): Promise<OutletMembership> {
    const response = await apiClient.post<{ data: OutletMembership }>(
      `/loyalty/members/${outletId}/${guestCustomerId}/adjust-points`,
      { points, note },
    );
    return response.data.data;
  },

  async getMemberPointHistory(
    outletId: string,
    guestCustomerId: string,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedPointHistory> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());

    const response = await apiClient.get<{ data: PaginatedPointHistory }>(
      `/loyalty/members/${outletId}/${guestCustomerId}/history?${params}`,
    );
    return response.data.data;
  },

  async getMemberRedemptions(outletId: string, guestCustomerId: string): Promise<RewardRedemption[]> {
    const response = await apiClient.get<{ data: RewardRedemption[] }>(
      `/loyalty/members/${outletId}/${guestCustomerId}/redemptions`,
    );
    return response.data.data;
  },
};
