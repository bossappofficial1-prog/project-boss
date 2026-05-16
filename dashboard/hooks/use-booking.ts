import { apiClient } from "@/lib/apis/base"
import { useQuery } from "@tanstack/react-query"

export interface BookingCalendarData {
    slots: Slot[]
    services: Service[]
    providers: string[]
    operatingHours: OperatingHour[]
}

export interface OperatingHour {
    dayOfWeek: number
    openTime: string
    closeTime: string
    isOpen: boolean
}

export interface Slot {
    id: string
    date: string
    startTime: string
    endTime: string
    status: SlotStatus
    serviceName: string
    providerName: string
    durationMinutes: number
    customer: any
}

export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export interface Service {
    id: string
    name: string
    providerName: string
    durationMinutes: number
}

interface BookingCalendarQuery {
    outletId: string,
    startDate: Date,
    endDate?: Date,
    productServiceId?: string,
    providerName?: string
}


export function useBookingCalendar(
    query: BookingCalendarQuery
) {
    return useQuery({
        queryKey: [
            "booking-calendar",
            query.outletId,
            query.startDate,
            query.endDate,
            query.providerName,
            query.productServiceId
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (query.outletId) params.append("outletId", query.outletId);

            if (query.startDate) params.append("startDate", query.startDate.toISOString());

            if (query.endDate) params.append("endDate", query.endDate.toISOString());

            if (query.productServiceId) params.append("productServiceId", query.productServiceId);

            if (query.providerName) params.append("providerName", query.providerName);

            const res = await apiClient.get(`/bookings/calendar?${params.toString()}`)

            return res.data.data as BookingCalendarData
        },
        enabled: !!query.outletId && !!query.outletId && !!query.startDate,
    })
}