import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posV2Api } from "@/lib/apis/pos-v2";
import { transactionDeleteApi } from "@/lib/apis/transaction-delete";

const KEYS = {
  deleteRequests: (outletId?: string) => ["transaction-deletes", outletId || "all"] as const,
};

export function useTransactionDeleteRequests(outletId?: string, status?: string) {
  return useQuery({
    queryKey: [...KEYS.deleteRequests(outletId), status],
    queryFn: () => transactionDeleteApi.getRequests(outletId, status),
    enabled: true,
    staleTime: 10_000,
  });
}

export function useRequestDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason?: string }) =>
      posV2Api.requestDeleteTransaction(transactionId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pos-v2", "recent-orders"],
      });
    },
  });
}

export function useApproveDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => transactionDeleteApi.approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.deleteRequests() });
      queryClient.invalidateQueries({ queryKey: ["pos-v2", "recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["pos-v2", "products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-v2", "cash-summary"] });
    },
  });
}

export function useRejectDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, rejectionNote }: { requestId: string; rejectionNote: string }) =>
      transactionDeleteApi.rejectRequest(requestId, rejectionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.deleteRequests() });
    },
  });
}
