import { useQuery } from "@tanstack/react-query";
import { getSlotByProductId } from "@/features/outlet/services/booking-slot.service";

export function useGetSlotProduct(productId: string, date: Date | null) {
  const dateStr = date
    ? date.toLocaleDateString("en-CA")
    : null;

  return useQuery({
    queryKey: ["slots", productId, dateStr],
    queryFn: () => getSlotByProductId(productId, dateStr as string),
    enabled: Boolean(productId && dateStr),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}
