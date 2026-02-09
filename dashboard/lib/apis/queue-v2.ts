import { apiCall, apiClient } from "./base";

export type QueueOrderStatus =
    | "AWAITING_PAYMENT"
    | "PROCESSING"
    | "CONFIRMED"
    | "READY"
    | "ON_GOING"
    | "COMPLETED"
    | "CANCELLED";

export interface QueueV2EntryItem {
    id: string;
    productName: string;
    productType: "SERVICE" | "GOODS";
    quantity: number;
    price: number;
    duration: number | null;
}

export interface QueueV2Entry {
    id: string;
    orderStatus: QueueOrderStatus;
    totalAmount: number;
    customerName: string;
    customerPhone: string | null;
    productName: string;
    productDuration: number | null;
    items: QueueV2EntryItem[];
    goodsCount: number;
    staffName: string | null;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
    bookingSlot: {
        id: string;
        startTime: string | null;
        endTime: string | null;
        status: string;
    } | null;
    paymentMethod: string | null;
    isManualPayment: boolean;
    paymentProofUrl: string | null;
    paymentStatus: string | null;
    cancellationReason: string | null;
}

export interface QueueV2Board {
    waiting: QueueV2Entry[];
    ready: QueueV2Entry[];
    inProgress: QueueV2Entry[];
    completed: QueueV2Entry[];
}

export interface QueueV2Stats {
    totalActive: number;
    waitingCount: number;
    readyCount: number;
    inProgressCount: number;
    completedToday: number;
    cancelledToday: number;
    avgWaitMinutes: number | null;
}

export interface QueueV2BoardResponse {
    board: QueueV2Board;
    stats: QueueV2Stats;
}

export const queueV2Api = {
    async getBoard(outletId: string): Promise<QueueV2BoardResponse> {
        return apiCall<QueueV2BoardResponse>(`/queue/v2/${outletId}/board`);
    },

    async transitionStatus(
        orderId: string,
        status: QueueOrderStatus,
        reason?: string,
    ): Promise<any> {
        return apiCall<any>(`/queue/v2/${orderId}/transition`, {
            method: "PATCH",
            body: JSON.stringify({ status, reason }),
        });
    },
};
