import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueV2Api, type QueueOrderStatus } from "@/lib/apis/queue-v2";

const KEYS = {
    board: (outletId: string) => ["queue-v2", "board", outletId] as const,
};

export function useQueueV2Board(outletId: string) {
    return useQuery({
        queryKey: KEYS.board(outletId),
        queryFn: () => queueV2Api.getBoard(outletId),
        enabled: !!outletId,
        staleTime: 10_000,
        refetchInterval: 30_000,
    });
}

export function useQueueV2Transition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: {
            orderId: string;
            status: QueueOrderStatus;
            reason?: string;
        }) => queueV2Api.transitionStatus(params.orderId, params.status, params.reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["queue-v2"] });
        },
    });
}

export function useInvalidateQueueV2() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ["queue-v2"] });
}
