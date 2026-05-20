import { apiCall, apiClient } from "./base";

export interface PosV2Product {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    type: "GOODS" | "SERVICE" | "TICKET";
    status: "ACTIVE";
    taxPercentage: number | null;
    taxName: string | null;
    price: number;
    stock: number | null;
    unit: string | null;
    barcode: string | null;
    sku: string | null;
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
    category?: { id: string; name: string } | null;
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
    paymentMethod: "cash" | "qris" | "none";
    cashReceived?: number;
    notes?: string;
    bookingSlotId?: string;
    bookingDate?: string;
    staffId?: string;
    pointsRedeemed?: number;
    tableNumber?: string;
    tableId?: string;
    isOpenBill?: boolean;
    existingOrderId?: string;
}

export interface PosV2OrderResult {
    orderId: string;
    totalAmount: number;
    subtotal?: number;
    discountAmount?: number;
    itemCount: number;
    cashReceived: number;
    change: number;
    customerName: string;
    createdAt: string;
    hasTickets: boolean;
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
    transactionId: string | null;
}

export interface PosV2OpenOrder {
    id: string;
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    tableNumber?: string;
    tableId?: string;
    itemCount: number;
    itemsSummary: string;
    items: Array<{
        id: string;
        productId: string;
        quantity: number;
        price: number;
        product: PosV2Product;
    }>;
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
    async getProducts(outletId: string, search?: string, type?: "GOODS" | "SERVICE" | "TICKET"): Promise<{ products: PosV2Product[]; meta: any }> {
        const params = new URLSearchParams({ outletId });
        if (search?.trim()) params.append("search", search.trim());
        if (type) params.append("type", type);
        return apiCall<{ products: PosV2Product[]; meta: any }>(`/pos/v2/products?${params}`);
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

    async getOpenOrders(outletId: string): Promise<PosV2OpenOrder[]> {
        return apiCall<PosV2OpenOrder[]>(`/pos/v2/open-orders?outletId=${outletId}`);
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
    async getReceiptPrint(orderId: string): Promise<ArrayBuffer> {
        const response = await apiClient.get(`/orders/${orderId}/receipt/print`, {
            responseType: "arraybuffer",
        });
        return response.data;
    },
    async getOrderTickets(orderId: string): Promise<any[]> {
        return apiCall<any[]>(`/tickets/order/${orderId}`);
    },

    async printOrderTickets(orderId: string): Promise<Blob> {
        const response = await apiClient.get(`/tickets/order/${orderId}/print`, {
            responseType: "blob",
        });
        return response.data;
    },

    async requestDeleteTransaction(transactionId: string, reason?: string): Promise<any> {
        return apiCall<any>("/transaction-deletes/request", {
            method: "POST",
            body: JSON.stringify({ transactionId, reason }),
        });
    },
};
