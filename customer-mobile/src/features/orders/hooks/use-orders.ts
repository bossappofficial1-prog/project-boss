import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrdersByPhone, cancelOrder, confirmOrder } from "../services/order.service";
import { useProfileStore } from "@/src/stores/profile.store";

export function useOrders() {
  const phone = useProfileStore((s) => s.phone);

  return useQuery({
    queryKey: ["orders", phone],
    queryFn: () => getOrdersByPhone(phone),
    enabled: !!phone,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const phone = useProfileStore((s) => s.phone);

  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  const phone = useProfileStore((s) => s.phone);

  return useMutation({
    mutationFn: (orderId: string) => confirmOrder(orderId, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
