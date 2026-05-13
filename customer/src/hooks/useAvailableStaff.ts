import { useQuery } from "@tanstack/react-query";
import { StaffService } from "@/services/staff";
import { StaffAvailabilityResponse } from "@/types/staff";

export function useAvailableStaff(
    productId?: string,
    slotId?: string | null,
    options?: { date?: string; startTime?: string; endTime?: string }
) {
    return useQuery<StaffAvailabilityResponse, Error>({
        queryKey: ["available-staff", productId, slotId, options?.date, options?.startTime, options?.endTime],
        queryFn: () => {
            if (!productId) throw new Error("Product ID is required");
            if (slotId) {
                return StaffService.getAvailableStaff(productId, { slotId });
            }
            if (!options?.date || !options?.startTime || !options?.endTime) {
                throw new Error("Either slotId or date/startTime/endTime must be provided");
            }
            return StaffService.getAvailableStaff(productId, {
                date: options.date,
                startTime: options.startTime,
                endTime: options.endTime,
            });
        },
        enabled: Boolean(productId && (slotId || (options?.date && options?.startTime && options?.endTime))),
        staleTime: 60_000,
    });
}
