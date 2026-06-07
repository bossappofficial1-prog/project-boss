import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import type { StaffAvailabilityResponse } from '@/types/staff';

interface AvailabilityOptions {
    date?: string;
    startTime?: string;
    endTime?: string;
}

export function useAvailableStaff(
    productId?: string,
    slotId?: string | null,
    options?: AvailabilityOptions,
) {
    return useQuery<StaffAvailabilityResponse, Error>({
        queryKey: ['pos', 'available-staff', productId, slotId, options?.date, options?.startTime, options?.endTime],
        enabled: Boolean(productId && (slotId || (options?.date && options?.startTime && options?.endTime))),
        queryFn: async () => {
            if (!productId) {
                throw new Error('Product ID wajib diisi');
            }

            if (slotId) {
                return staffApi.getAvailableStaff(productId, { slotId });
            }

            if (!options?.date || !options?.startTime || !options?.endTime) {
                throw new Error('Tanggal, waktu mulai, dan waktu selesai wajib diisi jika slot belum dipilih');
            }

            return staffApi.getAvailableStaff(productId, {
                date: options.date,
                startTime: options.startTime,
                endTime: options.endTime,
            });
        },
        staleTime: 60_000,
    });
}
