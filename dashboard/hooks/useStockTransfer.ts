import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockTransferApi } from "@/lib/apis/stockTransfer";

export const useStockTransfers = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  senderOutletId?: string;
  receiverOutletId?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["stock-transfers", params],
    queryFn: () => stockTransferApi.getAll(params),
  });
};

export const useStockTransfer = (id: string) => {
  return useQuery({
    queryKey: ["stock-transfer", id],
    queryFn: () => stockTransferApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateStockTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockTransferApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
};

export const useUpdateStockTransferStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "PENDING" | "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
    }) => stockTransferApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfer", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
};
