import { BookingSlot } from "@/services/booking-slot";
import { BookingSlot as BookingSlotType } from "@/types/booking-slots";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export function useGetSlotProduct(productId: string, date?: Date | null) {
    const dateStr = date ? format(date, "yyyy-MM-dd") : null;

    return useQuery<BookingSlotType[], Error>({
        queryKey: ["slots", productId, dateStr],
        queryFn: () => BookingSlot.getSlotByProductId(productId, dateStr as string),
        enabled: Boolean(productId && dateStr),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: 'always',
        refetchInterval: 1000 * 60,
    });
}