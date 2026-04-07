import { apiCall, apiClient } from "./base";

export interface LoyaltyConfig {
    id: string;
    outletId: string;
    pointsEarned: number;
    multiplierAmount: number;
    minSpending: number;
    isActive: boolean;
    updatedAt: string;
    pointValue: number;
}

export interface OutletMembership {
    id: string;
    guestCustomerId: string;
    outletId: string;
    points: number;
    tier: string;
    totalSpending: number;
    lastTransactionAt: string | null;
    createdAt: string;
    customer: {
        name: string;
        phone: string;
    };
}

export interface GetMembersQuery {
    page?: number;
    limit?: number;
    search?: string;
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

export const loyaltyApi = {
    async getConfig(outletId: string): Promise<LoyaltyConfig | null> {
        const response = await apiClient.get<LoyaltyConfig | null>(`/loyalty/config/${outletId}`);
        return response.data;
    },

    async upsertConfig(outletId: string, data: Partial<LoyaltyConfig>): Promise<LoyaltyConfig> {
        const response = await apiClient.put<LoyaltyConfig>(`/loyalty/config/${outletId}`, data);
        return response.data;
    },

    async getMembers(outletId: string, query: GetMembersQuery = {}): Promise<PaginatedMembers> {
        const params = new URLSearchParams();
        if (query.page) params.append("page", query.page.toString());
        if (query.limit) params.append("limit", query.limit.toString());
        if (query.search) params.append("search", query.search);

        const response = await apiClient.get<PaginatedMembers>(`/loyalty/members/${outletId}?${params}`);
        return response.data;
    },

    async registerMember(data: RegisterMemberRequest): Promise<OutletMembership> {
        const response = await apiClient.post<OutletMembership>("/loyalty/register", data);
        return response.data;
    },

    async adjustPoints(outletId: string, guestCustomerId: string, points: number): Promise<OutletMembership> {
        const response = await apiClient.post<OutletMembership>(
            `/loyalty/members/${outletId}/${guestCustomerId}/adjust-points`,
            { points }
        );
        return response.data;
    },
};
