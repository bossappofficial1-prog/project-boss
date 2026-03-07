import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersV2Api, type GoodsOrderStatus } from "@/lib/apis/orders-v2";

const KEYS = {
    board: (outletId: string) => ["orders-v2", "board", outletId] as const,
};

export function useOrdersV2Board(outletId: string) {
    return useQuery({
        queryKey: KEYS.board(outletId),
        queryFn: () => ordersV2Api.getBoard(outletId),
        enabled: !!outletId,
        staleTime: 10_000,
    });
}

export function useOrdersV2UpdateStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            orderId: string;
            status: GoodsOrderStatus;
            reason?: string;
        }) => ordersV2Api.updateStatus(params.orderId, params.status, params.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders-v2"] });
        },
    });
}

export function useInvalidateOrdersV2() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ["orders-v2"] });
}
