import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loyaltyApi, type GetMembersQuery, type RegisterMemberRequest, type LoyaltyConfig } from "@/lib/apis/loyalty";

const KEYS = {
    config: (outletId: string) => ["loyalty", "config", outletId] as const,
    members: (outletId: string, query: GetMembersQuery) => ["loyalty", "members", outletId, query] as const,
    pointHistory: (outletId: string, guestCustomerId: string, page: number, limit: number) =>
        ["loyalty", "point-history", outletId, guestCustomerId, page, limit] as const,
};

export function useLoyaltyConfig(outletId: string) {
    return useQuery({
        queryKey: KEYS.config(outletId),
        queryFn: () => loyaltyApi.getConfig(outletId),
        enabled: !!outletId,
        staleTime: 1000 * 60 * 5, // 5 menit
    });
}

export function useUpsertLoyaltyConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ outletId, data }: { outletId: string; data: Partial<LoyaltyConfig> }) =>
            loyaltyApi.upsertConfig(outletId, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: KEYS.config(variables.outletId),
            });
        },
    });
}

export function useLoyaltyMembers(outletId: string, query: GetMembersQuery = {}) {
    return useQuery({
        queryKey: KEYS.members(outletId, query),
        queryFn: () => loyaltyApi.getMembers(outletId, query),
        enabled: !!outletId,
        staleTime: 1000 * 60 * 1, // 1 menit
    });
}

export function useRegisterLoyaltyMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RegisterMemberRequest) => loyaltyApi.registerMember(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: KEYS.members(variables.outletId, {}),
            });
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
        }: {
            outletId: string;
            guestCustomerId: string;
            points: number;
        }) => loyaltyApi.adjustPoints(outletId, guestCustomerId, points),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["loyalty", "members", variables.outletId],
            });
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
