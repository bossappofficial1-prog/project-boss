import { apiClient } from "./base";
import { ApiResponse } from "@/types";

export interface Reservation {
    id: string;
    bookingDate: string;
    bookingDurationMinutes: number;
    orderStatus: string;
    guestCustomer: {
        name: string;
        phone: string;
    };
    table: {
        name: string;
    };
}

export interface CreateReservationPayload {
    customerName: string;
    customerPhone: string;
    bookingDate: string;
    durationMinutes: number;
    guestCount: number;
    tableId: string;
    notes?: string;
    outletId: string;
}

export const reservationApi = {
    list: async (params: { outletId: string; date?: string }) => {
        const { data } = await apiClient.get<ApiResponse<Reservation[]>>("/reservations", {
            params,
        });
        return data;
    },

    create: async (payload: CreateReservationPayload) => {
        const { data } = await apiClient.post<ApiResponse<Reservation>>("/reservations", payload);
        return data;
    },

    updateStatus: async (id: string, status: string, outletId: string) => {
        const { data } = await apiClient.patch<ApiResponse<Reservation>>(`/reservations/${id}/status`, { status }, {
            params: { outletId },
        });
        return data;
    }
};
