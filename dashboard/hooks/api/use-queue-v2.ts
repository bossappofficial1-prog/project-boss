import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queueV2Api, type QueueOrderStatus, type ReschedulePayload } from "@/lib/apis/queue-v2";

const KEYS = {
  board: (outletId: string, query?: string, date?: string) =>
    ["queue-v2", "board", outletId, query, date] as const,
};

export function useQueueV2Board(outletId: string, q?: string, date?: string) {
  return useQuery({
    queryKey: KEYS.board(outletId, q, date),
    queryFn: () => queueV2Api.getBoard(outletId, q, date),
    enabled: !!outletId,
    staleTime: 10_000,
  });
}

export function useQueueV2Transition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; status: QueueOrderStatus; reason?: string }) =>
      queueV2Api.transitionStatus(params.orderId, params.status, params.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-v2"] });
    },
  });
}

export function useInvalidateQueueV2() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["queue-v2"] });
}

export function useQueueV2Reschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string } & ReschedulePayload) =>
      queueV2Api.rescheduleOrder(params.orderId, {
        newSlotId: params.newSlotId,
        newDate: params.newDate,
        newStartTime: params.newStartTime,
        newEndTime: params.newEndTime,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-v2"] });
    },
  });
}
