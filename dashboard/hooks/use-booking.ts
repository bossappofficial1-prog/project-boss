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

export interface BookingListItem {
    id: string
    date: string
    startTime: string
    endTime: string
    status: SlotStatus
    serviceName: string
    providerName: string
    durationMinutes: number
    customerName: string | null
    customerPhone: string | null
    orderId: string | null
    orderStatus: string | null
    paymentStatus: string | null
    totalAmount: number | null
    createdAt: string
}

interface UseBookingsListParams {
    outletId: string
    page: number
    limit: number
    search?: string
    status?: string
    dateFrom?: string
    dateTo?: string
}

interface PaginatedBookingsResponse {
    data: BookingListItem[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export function useBookingsList(params: UseBookingsListParams) {
    return useQuery({
        queryKey: [
            "bookings-list",
            params.outletId,
            params.page,
            params.limit,
            params.search,
            params.status,
            params.dateFrom,
            params.dateTo,
        ],
        queryFn: async () => {
            const queryParams = new URLSearchParams({
                outletId: params.outletId,
                page: params.page.toString(),
                limit: params.limit.toString(),
            })
            if (params.search) queryParams.append("search", params.search)
            if (params.status && params.status !== "ALL") queryParams.append("status", params.status)
            if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom)
            if (params.dateTo) queryParams.append("dateTo", params.dateTo)

            const res = await apiClient.get(`/bookings?${queryParams.toString()}`)
            return res.data as PaginatedBookingsResponse
        },
        enabled: !!params.outletId,
    })
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