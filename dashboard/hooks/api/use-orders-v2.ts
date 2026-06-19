import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersV2Api, type GoodsOrderStatus } from "@/lib/apis/orders-v2";

const KEYS = {
  board: (outletId: string, query?: string, date?: string) =>
    ["orders-v2", "board", outletId, query, date] as const,
};

export function useOrdersV2Board(outletId: string, q?: string, date?: string) {
  return useQuery({
    queryKey: KEYS.board(outletId, q, date),
    queryFn: () => ordersV2Api.getBoard(outletId, q, date),
    enabled: !!outletId,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useOrdersV2UpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; status: GoodsOrderStatus; reason?: string }) =>
      ordersV2Api.updateStatus(params.orderId, params.status, params.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-v2"] });
    },
  });
}

export function useInvalidateOrdersV2() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["orders-v2"] });
}
