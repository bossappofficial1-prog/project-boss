import { apiCall, apiClient } from "./base";

export interface PosV2Product {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    type: "GOODS" | "SERVICE" | "TICKET";
    status: "ACTIVE";
    price: number;
    stock: number | null;
    unit: string | null;
    goodsId: string | null;
    serviceId: string | null;
    ticketId: string | null;
    durationMinutes: number | null;
    providerName: string | null;
    totalQuota: number | null;
    soldCount: number | null;
    eventDate: string | null;
    eventEndDate: string | null;
    venue: string | null;
}

export interface PosV2OutletQris {
    outletId: string;
    outletName: string;
    businessName: string;
    qrisImageUrl: string | null;
}

export interface PosV2OrderRequest {
    customer: {
        name: string;
        phone: string;
    };
    outletId: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    paymentMethod: "cash" | "qris";
    cashReceived?: number;
    notes?: string;
    bookingSlotId?: string;
    bookingDate?: string;
    staffId?: string;
}

export interface PosV2OrderResult {
    orderId: string;
    totalAmount: number;
    itemCount: number;
    cashReceived: number;
    change: number;
    customerName: string;
    createdAt: string;
}

export interface PosV2CashSummary {
    totalAmount: number;
    transactionsCount: number;
    date: string;
}

export interface PosV2RecentOrder {
    id: string;
    totalAmount: number;
    customerName: string;
    itemCount: number;
    itemsSummary: string;
    cashier: string;
    createdAt: string;
}

export interface BookingSlot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    productServiceId: string;
    availableStaffCount: number;
    totalStaffCount: number;
}

export interface AvailableStaff {
    id: string;
    name: string;
    email: string;
}

export const posV2Api = {
    async getProducts(outletId: string, search?: string, type?: "GOODS" | "SERVICE" | "TICKET"): Promise<PosV2Product[]> {
        const params = new URLSearchParams({ outletId });
        if (search?.trim()) params.append("search", search.trim());
        if (type) params.append("type", type);
        return apiCall<PosV2Product[]>(`/pos/v2/products?${params}`);
    },

    async createOrder(data: PosV2OrderRequest): Promise<PosV2OrderResult> {
        return apiCall<PosV2OrderResult>("/pos/v2/orders", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async getCashSummary(outletId: string): Promise<PosV2CashSummary> {
        return apiCall<PosV2CashSummary>(`/pos/v2/cash-summary?outletId=${outletId}`);
    },

    async getRecentOrders(outletId: string): Promise<PosV2RecentOrder[]> {
        return apiCall<PosV2RecentOrder[]>(`/pos/v2/recent-orders?outletId=${outletId}`);
    },

    async getBookingSlots(productId: string, date: string): Promise<BookingSlot[]> {
        return apiCall<BookingSlot[]>(`/pos/v2/products/${productId}/booking-slots?date=${date}`);
    },

    async getAvailableStaff(productId: string, slotId: string): Promise<{ staff: AvailableStaff[]; slotId: string }> {
        return apiCall<{ staff: AvailableStaff[]; slotId: string }>(
            `/pos/v2/products/${productId}/available-staff?slotId=${slotId}`,
        );
    },

    async getOutletQris(outletId: string): Promise<PosV2OutletQris> {
        return apiCall<PosV2OutletQris>(`/outlets/${outletId}/qris`);
    },

    async getReceipt(orderId: string): Promise<Blob> {
        const response = await apiClient.get(`/orders/${orderId}/receipt`, {
            responseType: "blob",
        });
        return response.data;
    },
};
