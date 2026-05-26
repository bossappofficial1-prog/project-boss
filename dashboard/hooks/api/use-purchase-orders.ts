import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  purchaseOrderApi,
  type PurchaseOrderStatus,
} from "@/lib/apis/purchase-order";

const KEYS = {
  list: (outletId: string) => ["purchase-orders", outletId] as const,
  detail: (id: string) => ["purchase-orders", "detail", id] as const,
};

export function usePurchaseOrders(
  outletId: string | undefined,
  params: {
    status?: PurchaseOrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: [...KEYS.list(outletId ?? ""), params],
    queryFn: () =>
      purchaseOrderApi.list({
        outletId: outletId!,
        ...params,
      }),
    enabled: !!outletId,
    staleTime: 10_000,
    select: (res) => ({ purchaseOrders: res.data, meta: res.meta }),
  });
}

export function usePurchaseOrderDetail(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => purchaseOrderApi.getById(id!),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useUpdatePOItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        notes?: string;
        items: Array<{
          productGoodsId?: string;
          ingredientId?: string;
          quantity: number;
          priceAtOrder: number;
        }>;
      };
    }) => purchaseOrderApi.updateDraftItems(id, payload),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(variables.id) });
    },
  });
}

export function useSendPO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.sendPO(id),
    onSuccess: (_, poId) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(poId) });
    },
  });
}

export function useCompletePO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.completePO(id),
    onSuccess: (_, poId) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(poId) });
      // Invalidate stock related queries as completing PO increments stock
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
